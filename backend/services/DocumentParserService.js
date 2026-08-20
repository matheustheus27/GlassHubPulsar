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
    // 1. Primary Engine: pdf-parse (Standard industrial PDF text extractor)
    if (pdfParse) {
      try {
        const parsed = await pdfParse(buffer);
        if (parsed && parsed.text && parsed.text.trim().length > 30) {
          logger.info(`[DocumentParser] Extracted ${parsed.text.length} chars from PDF via pdf-parse (${parsed.numpages || 1} pages)`);
          return parsed.text;
        }
      } catch (err) {
        logger.warn('[DocumentParser] pdf-parse engine error, falling back to Flate stream decoder:', err.message);
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
    // 1. Primary Engine: mammoth
    if (mammoth) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        if (result && result.value && result.value.trim().length > 20) {
          logger.info(`[DocumentParser] Extracted ${result.value.length} chars from DOCX via mammoth`);
          return result.value;
        }
      } catch (err) {
        logger.warn('[DocumentParser] mammoth parsing failed, using XML fallback:', err.message);
      }
    }

    // 2. Secondary Engine: Unzip word/document.xml and parse paragraphs
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
        // Extract paragraph by paragraph <w:p>...</w:p>
        const paragraphs = docXml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
        const textLines = [];

        for (const p of paragraphs) {
          const tTags = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          const pText = tTags.map(t => t.replace(/<[^>]+>/g, '')).join('');
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

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      const isSectionHeader = /^(RESUMO|EXPERIÊNCIA|COMPETÊNCIAS|FORMAÇÃO|PROJETOS|SUMMARY|EXPERIENCE|SKILLS|EDUCATION|PROJECTS)/i.test(line);
      const isContact = line.includes('@') || line.includes('http') || line.includes('📍') || line.includes('📞') || line.includes('✉️');
      if (!isSectionHeader && !isContact && line.length > 3 && line.length < 50) {
        if (candidateName === 'Candidato') {
          candidateName = line.replace(/^[#*\-•\s]+/, '').trim();
        } else if (candidateTitle === 'Desenvolvedor de Software' && !line.includes(candidateName)) {
          candidateTitle = line.replace(/^[#*\-•\s]+/, '').trim();
          break;
        }
      }
    }

    // 3. Section Slicing
    const sections = {};
    let currentSection = 'HEADER';
    let currentBuffer = [];

    const sectionHeaderRegex = /^(RESUMO\s*PROFISSIONAL|SUMMARY|PERFIL|COMPETÊNCIAS\s*TÉCNICAS|COMPETÊNCIAS|SKILLS|TECNOLOGIAS|EXPERIÊNCIA\s*PROFISSIONAL|EXPERIÊNCIA|HISTÓRICO\s*PROFISSIONAL|EXPERIENCE|FORMAÇÃO\s*ACADÊMICA|FORMAÇÃO|EDUCAÇÃO|EDUCATION|PROJETOS\s*PESSOAIS|PROJETOS|PROJECTS)(?:\s*\(CONTINUAÇÃO\))?$/i;

    for (const line of lines) {
      if (sectionHeaderRegex.test(line)) {
        if (currentBuffer.length > 0) {
          sections[currentSection] = (sections[currentSection] || '') + '\n' + currentBuffer.join('\n');
        }
        currentSection = line.toUpperCase().replace(/\s*\(CONTINUAÇÃO\)/g, '').trim();
        currentBuffer = [];
      } else {
        currentBuffer.push(line);
      }
    }

    if (currentBuffer.length > 0) {
      sections[currentSection] = (sections[currentSection] || '') + '\n' + currentBuffer.join('\n');
    }

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
    const summaryKey = Object.keys(sections).find(k => /RESUMO|SUMMARY|PERFIL/i.test(k));
    if (summaryKey && sections[summaryKey]) {
      html += `  <section class="resume-section" data-section="SUMMARY">\n`;
      html += `    <h2>RESUMO PROFISSIONAL</h2>\n`;
      html += `    <p class="summary-text">${sections[summaryKey].trim()}</p>\n`;
      html += `  </section>\n\n`;
    }

    // SKILLS SECTION
    const skillsKey = Object.keys(sections).find(k => /COMPETÊNCIAS|SKILLS|TECNOLOGIAS/i.test(k));
    if (skillsKey && sections[skillsKey]) {
      html += `  <section class="resume-section" data-section="SKILLS">\n`;
      html += `    <h2>COMPETÊNCIAS & TECNOLOGIAS</h2>\n`;
      html += `    <div class="skills-grid">\n`;
      
      const skillLines = sections[skillsKey].split('\n').map(l => l.trim()).filter(Boolean);
      let currentCat = 'Competências Gerais';
      let catItems = [];

      const flushCategory = () => {
        if (catItems.length > 0) {
          html += `      <div class="skill-category" data-category="${currentCat}">\n`;
          html += `        <h3>${currentCat}</h3>\n`;
          html += `        <ul class="skills-list">\n`;
          for (const item of catItems) {
            html += `          <li>${item}</li>\n`;
          }
          html += `        </ul>\n`;
          html += `      </div>\n`;
          catItems = [];
        }
      };

      const categoryHeaderRegex = /^(LINGUAGENS|FRAMEWORKS|BANCOS DE DADOS|DEVOPS|PROTOCOLOS|METODOLOGIAS|OUTROS|FERRAMENTAS|TESTES|CLOUD|BIBLIOTECAS)/i;

      for (const sLine of skillLines) {
        if (categoryHeaderRegex.test(sLine) || (sLine === sLine.toUpperCase() && sLine.length < 35 && !sLine.includes(','))) {
          flushCategory();
          currentCat = sLine.replace(/[:\-]/g, '').trim();
        } else {
          const items = sLine.split(/[,•|·/]/).map(s => s.trim()).filter(Boolean);
          for (const it of items) {
            if (it.split(/\s+/).length > 3 && !it.includes('&') && !it.includes('Clean Code')) {
              catItems.push(...it.split(/\s+/).filter(Boolean));
            } else {
              catItems.push(it);
            }
          }
        }
      }
      flushCategory();
      html += `    </div>\n`;
      html += `  </section>\n\n`;
    }

    // EXPERIENCE SECTION
    const expKey = Object.keys(sections).find(k => /EXPERIÊNCIA|HISTÓRICO|EXPERIENCE/i.test(k));
    if (expKey && sections[expKey]) {
      html += `  <section class="resume-section" data-section="EXPERIENCE">\n`;
      html += `    <h2>HISTÓRICO PROFISSIONAL</h2>\n`;
      html += `    <div class="experience-list">\n`;

      const expBlocks = sections[expKey].split(/\n(?=[A-Z0-9][A-Za-z0-9\s().\/-]{2,40}(?:\s+(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|\d{4})|\n))/g);

      for (const block of expBlocks) {
        const bLines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (bLines.length < 2) continue;

        const firstLine = bLines[0];
        const dateMatch = firstLine.match(/((?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|\d{4})[^\n–—]*[–—\-]\s*(?:Presente|Atual|\d{4}|(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)[^\n]*))/i)
          || (bLines[1] ? bLines[1].match(/((?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez|\d{4})[^\n–—]*[–—\-]\s*(?:Presente|Atual|\d{4}|(?:Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)[^\n]*))/i) : null);

        const period = dateMatch ? dateMatch[0].trim() : 'Período Recente';
        const company = firstLine.replace(period, '').replace(/[–—\-]/g, '').trim() || 'Empresa';
        const position = bLines[1] && !bLines[1].startsWith('•') && !bLines[1].startsWith('-') ? bLines[1].replace(/^[–—\-•\s]+/, '').trim() : 'Desenvolvedor';

        const bullets = [];
        const startIndex = (bLines[1] === position) ? 2 : 1;

        for (let i = startIndex; i < bLines.length; i++) {
          const bl = bLines[i].replace(/^[•\-\*]\s*/, '').trim();
          if (bl.length > 8) {
            bullets.push(bl);
          }
        }

        html += `      <div class="experience-item" data-company="${company}">\n`;
        html += `        <h3 class="company-name">${company}</h3>\n`;
        html += `        <span class="period">${period}</span>\n`;
        html += `        <p class="role-title">${position}</p>\n`;
        html += `        <ul class="achievements">\n`;
        for (const b of bullets) {
          html += `          <li>${b}</li>\n`;
        }
        html += `        </ul>\n`;
        html += `      </div>\n`;
      }

      html += `    </div>\n`;
      html += `  </section>\n\n`;
    }

    // EDUCATION SECTION
    const eduKey = Object.keys(sections).find(k => /FORMAÇÃO|EDUCAÇÃO|EDUCATION/i.test(k));
    if (eduKey && sections[eduKey]) {
      html += `  <section class="resume-section" data-section="EDUCATION">\n`;
      html += `    <h2>FORMAÇÃO ACADÊMICA</h2>\n`;
      html += `    <div class="education-list">\n`;

      const eduBlocks = sections[eduKey].split(/\n(?=[A-Z0-9][A-Za-z0-9\s().\/-]{2,40}(?:\s+(?:Concluído|Previsão|\d{4})|\n))/g);

      for (const block of eduBlocks) {
        const bLines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (bLines.length < 2) continue;

        const org = bLines[0].replace(/[–—\-]/g, '').trim();
        const degree = bLines[1] || 'Graduação';
        const dateMatch = (bLines[0] + ' ' + (bLines[1] || '')).match(/(Concluído em \d{4}|Previsão de conclusão em \d{4}|\d{4}\s*–\s*\d{4}|\d{4})/i);
        const period = dateMatch ? dateMatch[0] : 'Formação';
        const desc = bLines.slice(2).join(' ');

        html += `      <div class="education-item" data-institution="${org}">\n`;
        html += `        <h3 class="institution-name">${org}</h3>\n`;
        html += `        <p class="degree-title">${degree}</p>\n`;
        html += `        <span class="period">${period}</span>\n`;
        if (desc) html += `        <p class="education-description">${desc}</p>\n`;
        html += `      </div>\n`;
      }

      html += `    </div>\n`;
      html += `  </section>\n\n`;
    }

    // PROJECTS SECTION
    const projKey = Object.keys(sections).find(k => /PROJETOS|PROJECTS/i.test(k));
    if (projKey && sections[projKey]) {
      html += `  <section class="resume-section" data-section="PROJECTS">\n`;
      html += `    <h2>PROJETOS PESSOAIS</h2>\n`;
      html += `    <div class="projects-list">\n`;

      const projBlocks = sections[projKey].split(/\n(?=[A-Z0-9][A-Za-z0-9\s().\/-]{2,40}\n)/g);

      for (const block of projBlocks) {
        const bLines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (bLines.length < 2) continue;

        const title = bLines[0];
        const stack = bLines[1];
        const bullets = bLines.slice(2).map(b => b.replace(/^[•\-\*]\s*/, '').trim()).filter(b => b.length > 5);

        html += `      <div class="project-item" data-title="${title}">\n`;
        html += `        <h3 class="project-title">${title}</h3>\n`;
        html += `        <p class="project-stack">${stack}</p>\n`;
        html += `        <ul class="project-bullets">\n`;
        for (const b of bullets) {
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
   * Sanitizes and normalizes extracted resume text
   */
  cleanExtractedText(text) {
    if (!text || typeof text !== 'string') return '';

    return text
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
  }
}

module.exports = new DocumentParserService();

