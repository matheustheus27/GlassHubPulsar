/**
 * Document Parser Service (.pdf & .docx)
 * High-fidelity extraction pipeline with multi-tier resilience for resumes.
 */
const zlib = require('zlib');
const logger = require('../utils/logger');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  logger.warn('[DocumentParser] pdf-parse library not preloaded, using fallback engines');
}

let mammoth = null;
try {
  mammoth = require('mammoth');
} catch (e) {
  logger.warn('[DocumentParser] mammoth library not preloaded, using fallback XML engine');
}

class DocumentParserService {
  /**
   * Parse uploaded base64 / buffer file into clean raw text
   */
  async extractTextFromFile(fileBuffer, fileName = '') {
    if (!fileBuffer || fileBuffer.length === 0) {
      return '';
    }

    const isDocx = fileName.toLowerCase().endsWith('.docx') || fileBuffer.slice(0, 4).toString('hex') === '504b0304';
    const isPdf = fileName.toLowerCase().endsWith('.pdf') || fileBuffer.slice(0, 4).toString() === '%PDF';

    let rawText = '';
    if (isDocx) {
      rawText = await this.extractFromDocx(fileBuffer);
    } else if (isPdf) {
      rawText = await this.extractFromPdf(fileBuffer);
    } else {
      // Plain text or markdown
      rawText = fileBuffer.toString('utf-8');
    }

    return this.cleanExtractedText(rawText);
  }

  /**
   * Extract text from PDF buffer with multi-tier engine
   */
  async extractFromPdf(buffer) {
    // 1. Primary Engine: pdf-parse with custom page renderer for font style detection (<BOLD>, <ITALIC>)
    if (pdfParse) {
      try {
        const parsed = await pdfParse(buffer, { pagerender: this.renderPdfPageWithStyles.bind(this) });
        if (parsed && parsed.text && parsed.text.trim().length > 30) {
          logger.info(`[DocumentParser] Extracted ${parsed.text.length} chars from PDF with font style tags via pdf-parse (${parsed.numpages || 1} pages)`);
          return parsed.text;
        }
      } catch (err) {
        logger.warn('[DocumentParser] pdf-parse styled engine error, trying standard pdf-parse:', err.message);
        try {
          const parsed = await pdfParse(buffer);
          if (parsed && parsed.text && parsed.text.trim().length > 30) {
            return parsed.text;
          }
        } catch (e2) {}
      }
    }

    // 2. Secondary Engine: Decompress FlateDecode streams inside PDF buffer
    try {
      const decompressedText = this.extractFromPdfFlateStreams(buffer);
      if (decompressedText && decompressedText.trim().length > 30) {
        logger.info(`[DocumentParser] Extracted ${decompressedText.length} chars from PDF via FlateDecode stream decompressor`);
        return decompressedText;
      }
    } catch (err) {
      logger.warn('[DocumentParser] FlateDecode stream extractor error:', err.message);
    }

    // 3. Tertiary Engine: Puppeteer Headless PDF extraction
    try {
      const puppeteerText = await this.extractPdfViaPuppeteer(buffer);
      if (puppeteerText && puppeteerText.trim().length > 30) {
        logger.info(`[DocumentParser] Extracted ${puppeteerText.length} chars from PDF via Headless Chromium`);
        return puppeteerText;
      }
    } catch (err) {
      logger.warn('[DocumentParser] Puppeteer PDF extraction fallback error:', err.message);
    }

    // 4. Safe Fallback: Text token reconstruction excluding binary PDF headers
    return this.extractPdfSafeTokens(buffer);
  }

  /**
   * Custom page renderer for pdf-parse that detects font weight/italic style per text item
   */
  async renderPdfPageWithStyles(pageData) {
    const textContent = await pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
    const items = textContent.items || [];
    if (items.length === 0) return '';

    const processedItems = items.map(item => {
      const str = item.str || '';
      const fontName = item.fontName || '';
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const x = transform[4] || 0;
      const y = Math.round((transform[5] || 0) * 10) / 10;

      let isBold = false;
      let isItalic = false;

      if (pageData.commonObjs && pageData.commonObjs.has(fontName)) {
        const fontObj = pageData.commonObjs.get(fontName);
        if (fontObj) {
          const fn = String(fontObj.name || fontObj.fallbackName || '').toLowerCase();
          if (fontObj.isBold || fontObj.bold || /bold|black|700|800|900|heavy|w7|w8|w9/i.test(fn)) {
            isBold = true;
          }
          if (fontObj.isItalic || fontObj.italic || /italic|oblique|slanted/i.test(fn)) {
            isItalic = true;
          }
        }
      }

      const fontNameLower = String(fontName).toLowerCase();
      if (!isBold && /bold|black|heavy|700|800|900|w7|w8|w9/i.test(fontNameLower)) {
        isBold = true;
      }
      if (!isItalic && /italic|oblique|slanted/i.test(fontNameLower)) {
        isItalic = true;
      }

      return { str, x, y, isBold, isItalic };
    });

    // Group items into lines by Y coordinate (tolerance 3.5px)
    const lines = [];
    processedItems.forEach(item => {
      if (!item.str && item.str !== '0') return;

      let line = lines.find(l => Math.abs(l.y - item.y) <= 3.5);
      if (!line) {
        line = { y: item.y, items: [] };
        lines.push(line);
      }
      line.items.push(item);
    });

    // Sort lines from top to bottom (PDF Y coordinate is inverted)
    lines.sort((a, b) => b.y - a.y);

    const lineStrings = lines.map(line => {
      line.items.sort((a, b) => a.x - b.x);

      const taggedTokens = [];
      let currentGroup = null;

      line.items.forEach(item => {
        const text = item.str;
        if (!text) return;

        const styleKey = `${item.isBold ? 'B' : ''}${item.isItalic ? 'I' : ''}`;

        if (!currentGroup) {
          currentGroup = { styleKey, isBold: item.isBold, isItalic: item.isItalic, text };
        } else if (currentGroup.styleKey === styleKey) {
          const needsSpace = !currentGroup.text.endsWith(' ') && !text.startsWith(' ') && !/^[.,;:!?\)]/.test(text);
          currentGroup.text += (needsSpace ? ' ' : '') + text;
        } else {
          taggedTokens.push(this.formatTaggedText(currentGroup));
          currentGroup = { styleKey, isBold: item.isBold, isItalic: item.isItalic, text };
        }
      });

      if (currentGroup) {
        taggedTokens.push(this.formatTaggedText(currentGroup));
      }

      return taggedTokens.join(' ').replace(/\s{2,}/g, ' ').trim();
    });

    return lineStrings.filter(Boolean).join('\n');
  }

  formatTaggedText({ isBold, isItalic, text }) {
    if (!text) return '';
    const trimmed = text.trim();
    if (!trimmed) return text;

    const leadingMatch = text.match(/^\s*/);
    const trailingMatch = text.match(/\s*$/);
    const leadingSpace = leadingMatch ? leadingMatch[0] : '';
    const trailingSpace = trailingMatch ? trailingMatch[0] : '';

    // If string already contains tags or is only punctuation, don't re-wrap
    if (/^<[A-Z]+>/.test(trimmed) || /^[.,;:!?\(\)\-\–\—]+$/.test(trimmed)) {
      return text;
    }

    let result = trimmed;
    if (isBold && isItalic) {
      result = `<BOLD><ITALIC>${trimmed}</ITALIC></BOLD>`;
    } else if (isBold) {
      result = `<BOLD>${trimmed}</BOLD>`;
    } else if (isItalic) {
      result = `<ITALIC>${trimmed}</ITALIC>`;
    }

    return `${leadingSpace}${result}${trailingSpace}`;
  }

  /**
   * Decompresses Flate streams and parses PDF text commands (BT ... ET, Tj, TJ)
   */
  extractFromPdfFlateStreams(buffer) {
    const textBlocks = [];
    let searchIndex = 0;

    while (searchIndex < buffer.length) {
      const streamStart = buffer.indexOf(Buffer.from('stream'), searchIndex);
      if (streamStart === -1) break;

      // Find stream content beginning (after newline or crlf)
      let contentStart = streamStart + 6;
      if (buffer[contentStart] === 0x0d && buffer[contentStart + 1] === 0x0a) {
        contentStart += 2;
      } else if (buffer[contentStart] === 0x0a || buffer[contentStart] === 0x0d) {
        contentStart += 1;
      }

      const streamEnd = buffer.indexOf(Buffer.from('endstream'), contentStart);
      if (streamEnd === -1) break;

      const rawChunk = buffer.slice(contentStart, streamEnd);
      searchIndex = streamEnd + 9;

      let uncompressed = null;
      try {
        uncompressed = zlib.inflateSync(rawChunk);
      } catch (e1) {
        try {
          uncompressed = zlib.inflateRawSync(rawChunk);
        } catch (e2) {
          // Chunk is not a zlib flate stream (could be image, font, etc.)
          continue;
        }
      }

      if (uncompressed) {
        const streamStr = uncompressed.toString('latin1');
        const extracted = this.parsePdfTextOperators(streamStr);
        if (extracted) {
          textBlocks.push(extracted);
        }
      }
    }

    return textBlocks.join('\n\n');
  }

  /**
   * Parse PDF text layout operators (Tj, TJ, ', ", BT/ET blocks)
   */
  parsePdfTextOperators(content) {
    const lines = [];
    // Match text blocks inside BT (Begin Text) ... ET (End Text)
    const btMatches = content.match(/BT[\s\S]*?ET/g) || [content];

    for (const bt of btMatches) {
      // 1. Match bracket arrays: [(T) 10 (ext)] TJ
      const arrayMatches = bt.match(/\[([\s\S]*?)\]\s*TJ/g) || [];
      for (const arr of arrayMatches) {
        const strMatches = arr.match(/\((?:\\.|[^()\\])*\)/g) || [];
        const strPieces = strMatches.map(s => this.unescapePdfString(s.slice(1, -1)));
        const combined = strPieces.join('');
        if (combined.trim()) lines.push(combined.trim());
      }

      // 2. Match single string operators: (Text) Tj, ' or "
      const singleMatches = bt.match(/\(((?:\\.|[^()\\])*)\)\s*(?:Tj|'|")/g) || [];
      for (const single of singleMatches) {
        const raw = single.replace(/\)\s*(?:Tj|'|")$/, '').replace(/^\(/, '');
        const clean = this.unescapePdfString(raw);
        if (clean.trim()) lines.push(clean.trim());
      }
    }

    return lines.join(' ');
  }

  /**
   * Unescapes PDF literal strings (\n, \r, \t, octal codes \040)
   */
  unescapePdfString(str) {
    return str
      .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\([()\\])/g, '$1');
  }

  /**
   * Extracts text from PDF using Headless Puppeteer if available
   */
  async extractPdfViaPuppeteer(buffer) {
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      return '';
    }

    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });

      const page = await browser.newPage();
      const base64 = buffer.toString('base64');
      const dataUri = `data:application/pdf;base64,${base64}`;

      await page.goto(dataUri, { waitUntil: 'domcontentloaded', timeout: 8000 });
      const text = await page.evaluate(() => document.body.innerText || '');
      return text;
    } catch (e) {
      return '';
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  /**
   * Safe Fallback: Extract visible word sequences avoiding PDF metadata dictionaries
   */
  extractPdfSafeTokens(buffer) {
    const latin = buffer.toString('latin1');
    const cleaned = latin
      .replace(/\/Title\s*\([^\)]*\)/gi, '')
      .replace(/\/Creator\s*\([^\)]*\)/gi, '')
      .replace(/\/Producer\s*\([^\)]*\)/gi, '')
      .replace(/\/CreationDate\s*\([^\)]*\)/gi, '')
      .replace(/\/ModDate\s*\([^\)]*\)/gi, '')
      .replace(/%PDF-[\d.]+/g, '')
      .replace(/<<[\s\S]*?>>/g, '')
      .replace(/\b(stream|endstream|obj|endobj|xref|trailer|startxref)\b/g, '');

    const tokens = cleaned.match(/[\p{L}\p{N}\p{P}\p{Z}]{4,}/gu) || [];
    return tokens.filter(t => t.trim().length > 3 && !t.includes('/Font')).join(' ');
  }

  /**
   * Extract text from Microsoft Word DOCX
   */
  async extractFromDocx(buffer) {
    // 1. Primary Engine: mammoth HTML conversion to preserve bold/italic/underline styles
    if (mammoth) {
      try {
        const result = await mammoth.convertToHtml({ buffer });
        if (result && result.value && result.value.trim().length > 20) {
          const formattedText = this.convertHtmlToTaggedText(result.value);
          if (formattedText && formattedText.trim().length > 20) {
            logger.info(`[DocumentParser] Extracted ${formattedText.length} chars from DOCX with style tags via mammoth`);
            return formattedText;
          }
        }
      } catch (err) {
        logger.warn('[DocumentParser] mammoth HTML conversion failed, using raw text or XML fallback:', err.message);
        try {
          const rawResult = await mammoth.extractRawText({ buffer });
          if (rawResult && rawResult.value && rawResult.value.trim().length > 20) {
            return rawResult.value;
          }
        } catch (e2) {}
      }
    }

    // 2. Secondary Engine: Unzip word/document.xml and parse runs for <w:b> and <w:i>
    try {
      let searchIndex = 0;
      let docXml = '';

      while (searchIndex < buffer.length) {
        const pkIndex = buffer.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), searchIndex);
        if (pkIndex === -1) break;

        const nameLength = buffer.readUInt16LE(pkIndex + 26);
        const extraLength = buffer.readUInt16LE(pkIndex + 28);
        const fileName = buffer.slice(pkIndex + 30, pkIndex + 30 + nameLength).toString('utf-8');

        const dataStart = pkIndex + 30 + nameLength + extraLength;
        searchIndex = dataStart;

        if (fileName === 'word/document.xml') {
          const compMethod = buffer.readUInt16LE(pkIndex + 8);
          const compSize = buffer.readUInt32LE(pkIndex + 18);
          const compressedData = buffer.slice(dataStart, dataStart + compSize);

          if (compMethod === 8) {
            docXml = zlib.inflateRawSync(compressedData).toString('utf-8');
          } else if (compMethod === 0) {
            docXml = compressedData.toString('utf-8');
          }
          break;
        }
      }

      if (docXml) {
        const paragraphs = docXml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
        const textLines = [];

        for (const p of paragraphs) {
          const runs = p.match(/<w:r[\s\S]*?<\/w:r>/g) || [];
          let pText = '';

          for (const r of runs) {
            const isBold = /<w:b(\s|\/|>)/.test(r) && !/<w:b\s+w:val="(false|0)"/.test(r);
            const isItalic = /<w:i(\s|\/|>)/.test(r) && !/<w:i\s+w:val="(false|0)"/.test(r);

            const tTags = r.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
            let rText = tTags.map(t => t.replace(/<[^>]+>/g, '')).join('');

            if (rText.trim()) {
              if (isBold && isItalic) rText = `<BOLD><ITALIC>${rText.trim()}</ITALIC></BOLD>`;
              else if (isBold) rText = `<BOLD>${rText.trim()}</BOLD>`;
              else if (isItalic) rText = `<ITALIC>${rText.trim()}</ITALIC>`;
            }
            pText += rText;
          }

          if (pText.trim()) {
            textLines.push(pText.trim());
          }
        }

        const extracted = textLines.join('\n');
        logger.info(`[DocumentParser] Extracted ${extracted.length} chars from DOCX via XML parser`);
        return extracted;
      }
    } catch (err) {
      logger.error('Error parsing DOCX zip stream:', err);
    }

    return buffer.toString('utf-8');
  }

  convertHtmlToTaggedText(html) {
    if (!html) return '';

    let formatted = html
      .replace(/<strong>([\s\S]*?)<\/strong>/gi, '<BOLD>$1</BOLD>')
      .replace(/<b>([\s\S]*?)<\/b>/gi, '<BOLD>$1</BOLD>')
      .replace(/<em>([\s\S]*?)<\/em>/gi, '<ITALIC>$1</ITALIC>')
      .replace(/<i>([\s\S]*?)<\/i>/gi, '<ITALIC>$1</ITALIC>')
      .replace(/<u>([\s\S]*?)<\/u>/gi, '<UNDERLINE>$1</UNDERLINE>')
      .replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '<HIGHLIGHT>$1</HIGHLIGHT>')
      .replace(/<del>([\s\S]*?)<\/del>/gi, '<STRIKETHROUGH>$1</STRIKETHROUGH>')
      .replace(/<s>([\s\S]*?)<\/s>/gi, '<STRIKETHROUGH>$1</STRIKETHROUGH>')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<(?!\/?(BOLD|ITALIC|UNDERLINE|HIGHLIGHT|STRIKETHROUGH)\b)[^>]+>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return formatted;
  }

  /**
   * Converts raw resume text into a semantic HTML5/XML intermediate structure
   * @param {string} rawText 
   * @returns {string} Semantic HTML document
   */
  convertToStructuredHtml(rawText) {
    const text = this.cleanExtractedText(rawText);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Extract contact tokens
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    const phoneMatch = text.match(/(\+55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0].trim() : '';

    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const linkedinUrl = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';

    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
    const githubUrl = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '';

    const locMatch = text.match(/📍\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]+,\s*[A-Z]{2}(?:\s*-\s*[A-Za-zÀ-ÖØ-öø-ÿ]+)?)/i)
      || text.match(/([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,30},\s*[A-Z]{2}(?:\s*-\s*[A-Za-zÀ-ÖØ-öø-ÿ]+)?)/);
    const location = locMatch ? locMatch[1].trim() : 'Brasil';

    // 2. Candidate Name and Title
    let candidateName = 'Candidato';
    let candidateTitle = 'Desenvolvedor de Software';

    try {
      const CandidateParser = require('../parsers/CandidateParser');
      const candidateData = CandidateParser.parseCandidate(text, text);
      if (candidateData.name) candidateName = candidateData.name;
      if (candidateData.title) candidateTitle = candidateData.title;
    } catch (e) {
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        const isSectionHeader = /^(RESUMO|EXPERIÊNCIA|COMPETÊNCIAS|FORMAÇÃO|PROJETOS|SUMMARY|EXPERIENCE|SKILLS|EDUCATION|PROJECTS)/i.test(line);
        const isContact = line.includes('@') || line.includes('http') || line.includes('📍') || line.includes('📞') || line.includes('✉️');
        if (!isSectionHeader && !isContact && line.length > 3 && line.length < 80) {
          if (candidateName === 'Candidato') {
            candidateName = line.replace(/^[#*\-•\s]+/, '').trim();
          } else if (candidateTitle === 'Desenvolvedor de Software' && !line.includes(candidateName)) {
            candidateTitle = line.replace(/^[#*\-•\s]+/, '').trim();
            break;
          }
        }
      }
    }

    // 3. Section Slicing via ResumeSectionParser
    const ResumeSectionParser = require('../parsers/ResumeSectionParser');
    const sections = ResumeSectionParser.parseSections(text);

    // 4. Build Structured HTML
    let html = `<!DOCTYPE html>\n<article class="glasshub-resume-document">\n`;
    html += `  <header class="candidate-header">\n`;
    html += `    <h1 class="candidate-name">${candidateName}</h1>\n`;
    html += `    <p class="candidate-title">${candidateTitle}</p>\n`;
    html += `    <div class="contact-details">\n`;
    if (email) html += `      <span class="contact-email" data-icon="✉️">${email}</span>\n`;
    if (phone) html += `      <span class="contact-phone" data-icon="📞">${phone}</span>\n`;
    if (location) html += `      <span class="contact-location" data-icon="📍">${location}</span>\n`;
    if (linkedinUrl) html += `      <a href="${linkedinUrl}" class="contact-linkedin" data-icon="💼">LinkedIn</a>\n`;
    if (githubUrl) html += `      <a href="${githubUrl}" class="contact-github" data-icon="🐙">GitHub</a>\n`;
    html += `    </div>\n`;
    html += `  </header>\n\n`;

    // SUMMARY SECTION
    if (sections.summary) {
      html += `  <section class="resume-section" data-section="SUMMARY">\n`;
      html += `    <h2>RESUMO PROFISSIONAL</h2>\n`;
      html += `    <p class="summary-text">${sections.summary.trim()}</p>\n`;
      html += `  </section>\n\n`;
    }

    // SKILLS SECTION
    if (sections.skills) {
      html += `  <section class="resume-section" data-section="SKILLS">\n`;
      html += `    <h2>COMPETÊNCIAS & TECNOLOGIAS</h2>\n`;
      html += `    <div class="skills-grid">\n`;

      const SkillsParser = require('../parsers/SkillsParser');
      const parsedSkills = SkillsParser.parseSkills(sections.skills);

      for (const cat of parsedSkills) {
        html += `      <div class="skill-category" data-category="${cat.category}">\n`;
        html += `        <h3>${cat.category}</h3>\n`;
        html += `        <ul class="skills-list">\n`;
        for (const item of cat.items) {
          html += `          <li>${item}</li>\n`;
        }
        html += `        </ul>\n`;
        html += `      </div>\n`;
      }
      html += `    </div>\n`;
      html += `  </section>\n\n`;
    }

    // EXPERIENCE SECTION
    if (sections.experience) {
      html += `  <section class="resume-section" data-section="EXPERIENCE">\n`;
      html += `    <h2>HISTÓRICO PROFISSIONAL</h2>\n`;
      html += `    <div class="experience-list">\n`;

      const ExperienceParser = require('../parsers/ExperienceParser');
      const parsedExps = ExperienceParser.parseExperiences(sections.experience);

      for (const exp of parsedExps) {
        html += `      <div class="experience-item" data-company="${exp.company}">\n`;
        html += `        <h3 class="company-name">${exp.company}</h3>\n`;
        html += `        <span class="period">${exp.period || 'Período Recente'}</span>\n`;
        html += `        <p class="role-title">${exp.position || 'Profissional'}</p>\n`;
        html += `        <ul class="achievements">\n`;
        for (const b of exp.bullets) {
          html += `          <li>${b}</li>\n`;
        }
        html += `        </ul>\n`;
        html += `      </div>\n`;
      }

      html += `    </div>\n`;
      html += `  </section>\n\n`;
    }

    // EDUCATION SECTION
    if (sections.education) {
      html += `  <section class="resume-section" data-section="EDUCATION">\n`;
      html += `    <h2>FORMAÇÃO ACADÊMICA</h2>\n`;
      html += `    <div class="education-list">\n`;

      const EducationParser = require('../parsers/EducationParser');
      const parsedEdus = EducationParser.parseEducation(sections.education);

      for (const edu of parsedEdus) {
        html += `      <div class="education-item" data-institution="${edu.institution}">\n`;
        html += `        <h3 class="institution-name">${edu.institution}</h3>\n`;
        html += `        <p class="degree-title">${edu.degree || 'Graduação'}</p>\n`;
        html += `        <span class="period">${edu.period || 'Formação'}</span>\n`;
        if (edu.description) html += `        <p class="education-description">${edu.description}</p>\n`;
        html += `      </div>\n`;
      }

      html += `    </div>\n`;
      html += `  </section>\n\n`;
    }

    // PROJECTS SECTION
    if (sections.projects) {
      html += `  <section class="resume-section" data-section="PROJECTS">\n`;
      html += `    <h2>PROJETOS PESSOAIS</h2>\n`;
      html += `    <div class="projects-list">\n`;

      const ProjectParser = require('../parsers/ProjectParser');
      const parsedProjs = ProjectParser.parseProjects(sections.projects);

      for (const proj of parsedProjs) {
        html += `      <div class="project-item" data-title="${proj.name}">\n`;
        html += `        <h3 class="project-title">${proj.name}</h3>\n`;
        if (proj.description) html += `        <p class="project-stack">${proj.description}</p>\n`;
        html += `        <ul class="project-bullets">\n`;
        for (const b of proj.bullets) {
          html += `          <li>${b}</li>\n`;
        }
        html += `        </ul>\n`;
        html += `      </div>\n`;
      }

      html += `    </div>\n`;
      html += `  </section>\n\n`;
    }

    html += `</article>`;
    return html;
  }

  /**
   * Normalizes unwanted line breaks inside PDF paragraphs while preserving section headers
   */
  normalizePdfLineBreaks(text) {
    if (!text || typeof text !== 'string') return '';

    const lines = text.split('\n');
    const normalizedLines = [];

    let isSectionHeaderSeen = false;

    for (let i = 0; i < lines.length; i++) {
      const current = lines[i].trim();
      if (!current) {
        normalizedLines.push('');
        continue;
      }

      const isCurrentSectionHeader = /^(RESUMO|SUMMARY|PERFIL|COMPETÊNCIAS|SKILLS|HISTÓRICO|EXPERIÊNCIA|EXPERIENCE|FORMAÇÃO|EDUCATION|PROJETOS|PROJECTS)/i.test(current);
      if (isCurrentSectionHeader) {
        isSectionHeaderSeen = true;
      }

      if (normalizedLines.length === 0) {
        normalizedLines.push(current);
        continue;
      }

      const prevIndex = normalizedLines.length - 1;
      const prev = normalizedLines[prevIndex];

      const isPrevSectionHeader = /^(RESUMO|SUMMARY|PERFIL|COMPETÊNCIAS|SKILLS|HISTÓRICO|EXPERIÊNCIA|EXPERIENCE|FORMAÇÃO|EDUCATION|PROJETOS|PROJECTS)/i.test(prev);
      const isBullet = /^[•\-\*\d+\.]\s/.test(current);
      const prevEndsWithTerminator = /[.:!?]$/.test(prev);
      const isPrevShortTitle = prev.length < 40 && (prev === prev.toUpperCase() || /^[A-ZÀ-ÖØ-ß\s&/\\()\-]{3,35}$/.test(prev)) && !prev.includes(',');

      if (isSectionHeaderSeen && !isPrevSectionHeader && !isCurrentSectionHeader && !isBullet && !isPrevShortTitle && !prevEndsWithTerminator && prev.length > 0 && current.length > 0) {
        normalizedLines[prevIndex] = prev + ' ' + current;
      } else {
        normalizedLines.push(current);
      }
    }

    return normalizedLines.join('\n').replace(/ {2,}/g, ' ');
  }

  /**
   * Sanitizes and normalizes extracted resume text
   */
  cleanExtractedText(text) {
    if (!text || typeof text !== 'string') return '';

    const cleaned = text
      // Remove PDF binary header leaks (single line only)
      .replace(/%?PDF-[\d.]+/gi, '')
      .replace(/\/Title\s*\([^)\n\r]*\)/gi, '')
      .replace(/\/Creator\s*\([^)\n\r]*\)/gi, '')
      .replace(/\/Producer\s*\([^)\n\r]*\)/gi, '')
      .replace(/\/CreationDate\s*\([^)\n\r]*\)/gi, '')
      .replace(/\/ModDate[^\n\r]*/gi, '')
      .replace(/\/ca\s+[\d.]+/gi, '')
      .replace(/\/BM\s+\/[A-Za-z]+/gi, '')
      // Remove any lines that start with PDF dictionary/metadata markers
      .replace(/^\/(?:Title|Creator|Producer|CreationDate|ModDate|ca|BM|Root|Pages|Kids|Count|Parent|Font|ProcSet|MediaBox)\b[^\n\r]*/gim, '')
      // Normalize whitespace and control characters
      .replace(/\r\n/g, '\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return this.normalizePdfLineBreaks(cleaned);
  }
}

module.exports = new DocumentParserService();

