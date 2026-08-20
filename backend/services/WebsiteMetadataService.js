/**
 * WebsiteMetadataService
 * 
 * Fetches website <title> and favicon with aggressive timeout and caching
 * to support custom portfolio titles even on staging/temporary hosting URLs.
 */
const https = require('https');
const http = require('http');

// In-memory cache for fast repeated resolution: { [url]: { title: string, favicon: string } }
const metadataCache = new Map();

class WebsiteMetadataService {
  /**
   * Resolves website metadata (<title> and domain/favicon)
   * @param {string} rawUrl
   * @param {number} timeoutMs - Max wait time in ms (default: 1500ms)
   * @returns {Promise<{ title: string, domain: string, favicon: string }>}
   */
  static async resolveWebsiteMetadata(rawUrl, timeoutMs = 1500) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { title: 'Portfólio', domain: '', favicon: '' };
    }

    const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    let parsedUrl;
    try {
      parsedUrl = new URL(cleanUrl);
    } catch (e) {
      return { title: rawUrl, domain: rawUrl, favicon: '' };
    }

    const domain = parsedUrl.hostname.replace(/^www\./, '');
    const fallbackTitle = domain;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

    if (metadataCache.has(cleanUrl)) {
      return metadataCache.get(cleanUrl);
    }

    try {
      const fetchedTitle = await this.fetchHtmlTitle(cleanUrl, timeoutMs);
      const finalTitle = fetchedTitle || fallbackTitle;
      const result = { title: finalTitle, domain, favicon: faviconUrl };
      metadataCache.set(cleanUrl, result);
      return result;
    } catch (err) {
      const result = { title: fallbackTitle, domain, favicon: faviconUrl };
      metadataCache.set(cleanUrl, result);
      return result;
    }
  }

  /**
   * Synchronous fallback to resolve title from domain if async is not available
   */
  static resolveDomainSync(rawUrl) {
    if (!rawUrl) return 'Portfólio';
    try {
      const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      const parsed = new URL(cleanUrl);
      return parsed.hostname.replace(/^www\./, '');
    } catch (e) {
      return rawUrl;
    }
  }

  /**
   * Fetches only the <head> of the webpage to extract the <title> tag
   */
  static fetchHtmlTitle(urlStr, timeoutMs = 1500) {
    return new Promise((resolve) => {
      let resolved = false;
      const done = (val) => {
        if (!resolved) {
          resolved = true;
          resolve(val);
        }
      };

      const timer = setTimeout(() => done(null), timeoutMs);

      try {
        const client = urlStr.startsWith('https') ? https : http;
        const req = client.get(urlStr, { headers: { 'User-Agent': 'GlassHub-Metadata-Bot/1.0' } }, (res) => {
          // Follow redirect once if status 301/302
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            clearTimeout(timer);
            let redirectUrl = res.headers.location;
            if (!redirectUrl.startsWith('http')) {
              try {
                redirectUrl = new URL(redirectUrl, urlStr).toString();
              } catch (e) {
                return done(null);
              }
            }
            return this.fetchHtmlTitle(redirectUrl, timeoutMs).then(done);
          }

          if (res.statusCode !== 200) {
            clearTimeout(timer);
            return done(null);
          }

          let body = '';
          res.setEncoding('utf-8');

          res.on('data', (chunk) => {
            body += chunk;
            // Stop once we find </head> or </title>
            const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              clearTimeout(timer);
              req.destroy();
              const cleanTitle = titleMatch[1]
                .replace(/\s+/g, ' ')
                .replace(/[-|·•—]\s*(Home|Portf[oó]lio|Welcome|Website|In[ií]cio).*$/i, '')
                .trim();
              done(cleanTitle.slice(0, 40));
            }

            if (body.length > 30000 || body.includes('</head>')) {
              clearTimeout(timer);
              req.destroy();
              done(null);
            }
          });

          res.on('end', () => {
            clearTimeout(timer);
            const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              const cleanTitle = titleMatch[1]
                .replace(/\s+/g, ' ')
                .replace(/[-|·•—]\s*(Home|Portf[oó]lio|Welcome|Website|In[ií]cio).*$/i, '')
                .trim();
              done(cleanTitle.slice(0, 40));
            } else {
              done(null);
            }
          });
        });

        req.on('error', () => {
          clearTimeout(timer);
          done(null);
        });

        req.setTimeout(timeoutMs, () => {
          clearTimeout(timer);
          req.destroy();
          done(null);
        });
      } catch (err) {
        clearTimeout(timer);
        done(null);
      }
    });
  }
}

module.exports = WebsiteMetadataService;
