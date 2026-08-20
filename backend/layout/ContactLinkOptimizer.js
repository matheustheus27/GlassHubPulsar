/**
 * ContactLinkOptimizer
 * 
 * Intelligent bounding box and string width estimation algorithm.
 * Dynamically balances contact links/badges across rows to eliminate
 * ugly orphan/widow links (e.g. 3 links in row 1, 1 lonely link in row 2)
 * and produces symmetric, aesthetically pleasing distributions (e.g. 2x2, 3x2, 3x1, 1x4).
 */

class ContactLinkOptimizer {
  /**
   * Estimates rendered width of a contact badge in pixels
   * @param {Object} item - { title, link, icon }
   * @param {number} fontSizePx - Default 11px
   * @returns {number} Width in pixels
   */
  static estimateItemWidth(item, fontSizePx = 11) {
    if (!item) return 0;
    const text = item.title || "";
    // Character width factor based on Inter font at ~11px
    const avgCharWidth = fontSizePx * 0.58;
    const iconWidth = item.icon ? 22 : 0;
    const padding = 16; // 8px left + 8px right
    const gap = 12; // inter-item margin/gap

    return Math.round(iconWidth + (text.length * avgCharWidth) + padding + gap);
  }

  /**
   * Distributes a list of contact items into balanced rows
   * @param {Array} items - List of contact objects
   * @param {number} containerWidthPx - Usable width (e.g., 680px for printable A4 content)
   * @returns {Array<Array>} Array of rows containing items
   */
  static balanceLinks(items = [], containerWidthPx = 680) {
    if (!Array.isArray(items) || items.length === 0) return [];
    if (items.length === 1) return [[items[0]]];

    const widths = items.map(item => this.estimateItemWidth(item));
    const totalWidth = widths.reduce((acc, w) => acc + w, 0);

    // 1. If all fit cleanly in a single line, return 1 row
    if (totalWidth <= containerWidthPx) {
      return [items];
    }

    const n = items.length;

    // 2. Specific aesthetic heuristics for small link counts to prevent widows
    if (n === 2) {
      // 2 items that don't fit 1 row -> 1 per row
      return [[items[0]], [items[1]]];
    }

    if (n === 3) {
      // If 3 items don't fit in 1 line:
      // Compare (2 + 1) with width balance
      const w01 = widths[0] + widths[1];
      const w12 = widths[1] + widths[2];
      if (w01 <= containerWidthPx) {
        return [[items[0], items[1]], [items[2]]];
      }
      return [[items[0]], [items[1], items[2]]];
    }

    if (n === 4) {
      // 4 items: strictly prefer 2x2 over 3+1 (which leaves 1 orphan link)
      return [
        [items[0], items[1]],
        [items[2], items[3]]
      ];
    }

    if (n === 5) {
      // 5 items: strictly prefer 3x2 or 2x3 over 4+1
      const wFirst3 = widths[0] + widths[1] + widths[2];
      if (wFirst3 <= containerWidthPx) {
        return [
          [items[0], items[1], items[2]],
          [items[3], items[4]]
        ];
      }
      return [
        [items[0], items[1]],
        [items[2], items[3], items[4]]
      ];
    }

    if (n === 6) {
      // 6 items: prefer 3x3 or 2x2x2
      const wFirst3 = widths[0] + widths[1] + widths[2];
      const wLast3 = widths[3] + widths[4] + widths[5];
      if (wFirst3 <= containerWidthPx && wLast3 <= containerWidthPx) {
        return [
          [items[0], items[1], items[2]],
          [items[3], items[4], items[5]]
        ];
      }
    }

    // 3. General Dynamic Partitioning for arbitrary item counts
    const targetRows = Math.ceil(totalWidth / containerWidthPx);
    const targetItemsPerRow = Math.ceil(n / targetRows);

    const rows = [];
    let currentRow = [];
    let currentWidth = 0;

    for (let i = 0; i < n; i++) {
      const item = items[i];
      const itemWidth = widths[i];

      // Check if adding exceeds container or creates an uneven last row
      const remainingItems = n - i;
      const isLastSlotRisk = remainingItems === 1 && currentRow.length >= targetItemsPerRow;

      if ((currentWidth + itemWidth > containerWidthPx || currentRow.length >= targetItemsPerRow) && currentRow.length > 0 && !isLastSlotRisk) {
        rows.push(currentRow);
        currentRow = [item];
        currentWidth = itemWidth;
      } else {
        currentRow.push(item);
        currentWidth += itemWidth;
      }
    }

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    // 4. Post-processing: If last row has only 1 item and previous has >= 3, rebalance 1 item
    if (rows.length >= 2) {
      const lastRow = rows[rows.length - 1];
      const prevRow = rows[rows.length - 2];

      if (lastRow.length === 1 && prevRow.length >= 3) {
        const movedItem = prevRow.pop();
        lastRow.unshift(movedItem);
      }
    }

    return rows;
  }

  /**
   * Returns clean vector SVG icons for social and contact links
   */
  static getSvgIcon(item) {
    if (!item) return '';
    const title = (item.title || "").toLowerCase();
    const link = (item.link || "").toLowerCase();
    const icon = String(item.icon || "");

    // 1. Facebook
    if (link.includes("facebook") || title.includes("facebook") || icon.includes("facebook") || icon === "📘") {
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
    }

    // 2. Instagram
    if (link.includes("instagram") || title.includes("instagram") || icon.includes("instagram") || icon === "📸" || icon === "📷") {
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
    }

    // 3. X / Twitter
    if (link.includes("twitter") || link.includes("x.com") || title === "x" || title.includes("twitter") || icon.includes("x") || icon === "𝕏") {
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
    }

    // 4. LinkedIn
    if (link.includes("linkedin") || title.includes("linkedin") || icon === "💼") {
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
    }

    // 5. GitHub
    if (link.includes("github") || title.includes("github") || icon === "🐙") {
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`;
    }

    // 6. Portfolio / Web (Favicon or Globe)
    if (item.favicon || (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:')))) {
      const iconUrl = item.favicon || item.icon;
      return `<img class="svg-icon favicon-icon" src="${iconUrl}" width="13" height="13" style="border-radius: 2px; vertical-align: middle; object-fit: contain;" alt="" onerror="this.outerHTML='<svg class=\\\'svg-icon\\\' viewBox=\\\'0 0 24 24\\\' width=\\\'13\\\' height=\\\'13\\\' fill=\\\'none\\\' stroke=\\\'currentColor\\\' stroke-width=\\\'2\\\'><circle cx=\\\'12\\\' cy=\\\'12\\\' r=\\\'10\\\'></circle><line x1=\\\'2\\\' y1=\\\'12\\\' x2=\\\'22\\\' y2=\\\'12\\\'></line></svg>'" />`;
    }

    if (link.includes("portfolio") || link.includes("http") || title.includes("portfólio") || title.includes("portfolio") || icon === "🌐") {
      if (link.startsWith("http")) {
        try {
          const domain = new URL(link).hostname.replace(/^www\./, '');
          const favUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
          return `<img class="svg-icon favicon-icon" src="${favUrl}" width="13" height="13" style="border-radius: 2px; vertical-align: middle; object-fit: contain;" alt="" onerror="this.outerHTML='<svg class=\\\'svg-icon\\\' viewBox=\\\'0 0 24 24\\\' width=\\\'13\\\' height=\\\'13\\\' fill=\\\'none\\\' stroke=\\\'currentColor\\\' stroke-width=\\\'2\\\'><circle cx=\\\'12\\\' cy=\\\'12\\\' r=\\\'10\\\'></circle><line x1=\\\'2\\\' y1=\\\'12\\\' x2=\\\'22\\\' y2=\\\'12\\\'></line></svg>'" />`;
        } catch (e) {}
      }
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
    }

    // 7. Email
    if (link.includes("mailto") || title.includes("@") || icon === "✉️") {
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
    }

    // 8. Phone / WhatsApp
    if (link.includes("wa.me") || link.includes("phone") || link.includes("tel") || icon === "📞") {
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
    }

    // 9. Location
    if (icon === "📍" || title.includes("mg") || title.includes("sp") || title.includes("rj") || title.includes("brasil") || title.includes("brazil")) {
      return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    }

    // Default link SVG
    return `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
  }

  /**
   * Generates optimized HTML for contact badges arranged in balanced rows
   */
  static renderHtml(items = [], containerWidthPx = 680, styles = {}) {
    const rows = this.balanceLinks(items, containerWidthPx);

    const rowsHtml = rows.map((rowItems, rowIndex) => {
      const badgesHtml = rowItems.map(item => {
        const svgIcon = this.getSvgIcon(item);
        return `
          <a href="${item.link || '#'}" target="_blank" class="contact-badge" rel="noreferrer">
            <span class="contact-icon">${svgIcon}</span>
            <span class="contact-text">${item.title}</span>
          </a>
        `;
      }).join("");

      return `<div class="contacts-row contacts-row-${rowIndex + 1}">${badgesHtml}</div>`;
    }).join("");

    return `
      <div class="contacts-balanced-grid">
        ${rowsHtml}
      </div>
    `;
  }
}

module.exports = ContactLinkOptimizer;
