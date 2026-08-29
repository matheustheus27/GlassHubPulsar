/**
 * ContactLinkOptimizer
 * 
 * Intelligent bounding box and string width estimation algorithm.
 * Dynamically balances contact links/badges across rows to eliminate
 * ugly orphan/widow links and renders glassmorphic contact badges.
 */

class ContactLinkOptimizer {
  /**
   * Estimates rendered width of a contact badge in pixels
   */
  static estimateItemWidth(item, fontSizePx = 11) {
    if (!item) return 0;
    const text = item.title || "";
    // Character width factor based on Roboto font at ~11px
    const avgCharWidth = fontSizePx * 0.55;
    const iconWidth = 24; // 20px glass icon box + 4px gap
    const padding = 20; // 8px left + 8px right + border
    const gap = 10; // inter-item margin/gap

    return Math.round(iconWidth + (text.length * avgCharWidth) + padding + gap);
  }

  /**
   * Distributes a list of contact items into balanced rows
   */
  static balanceLinks(items = [], containerWidthPx = 680) {
    if (!Array.isArray(items) || items.length === 0) return [];
    if (items.length === 1) return [[items[0]]];

    const widths = items.map(item => this.estimateItemWidth(item));
    const totalWidth = widths.reduce((acc, w) => acc + w, 0);

    if (totalWidth <= containerWidthPx) {
      return [items];
    }

    const n = items.length;

    if (n === 2) {
      return [[items[0]], [items[1]]];
    }

    if (n === 3) {
      const w01 = widths[0] + widths[1];
      if (w01 <= containerWidthPx) {
        return [[items[0], items[1]], [items[2]]];
      }
      return [[items[0]], [items[1], items[2]]];
    }

    if (n === 4) {
      return [
        [items[0], items[1]],
        [items[2], items[3]]
      ];
    }

    if (n === 5) {
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
      const wFirst3 = widths[0] + widths[1] + widths[2];
      const wLast3 = widths[3] + widths[4] + widths[5];
      if (wFirst3 <= containerWidthPx && wLast3 <= containerWidthPx) {
        return [
          [items[0], items[1], items[2]],
          [items[3], items[4], items[5]]
        ];
      }
    }

    const targetRows = Math.ceil(totalWidth / containerWidthPx);
    const targetItemsPerRow = Math.ceil(n / targetRows);

    const rows = [];
    let currentRow = [];
    let currentWidth = 0;

    for (let i = 0; i < n; i++) {
      const item = items[i];
      const itemWidth = widths[i];

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
   * Returns clean vector SVG icons matching GlassIcon component
   */
  static getSvgIcon(item) {
    if (!item) return '';
    const title = (item.title || "").toLowerCase();
    const link = (item.link || "").toLowerCase();
    const icon = String(item.icon || "");

    // 0. Direct SVG string passed from frontend
    if (item.svg && item.svg.trim().startsWith('<svg')) {
      return item.svg;
    }
    if (icon.trim().startsWith('<svg')) {
      return icon;
    }

    // 0.1 Direct image / favicon URL or data URI
    if (item.customIcon || item.iconUrl || item.favicon || icon.startsWith('http') || icon.startsWith('data:')) {
      const iconUrl = item.customIcon || item.iconUrl || item.favicon || icon;
      return `<img class="svg-icon favicon-icon" src="${iconUrl}" width="12" height="12" style="border-radius: 2px; vertical-align: middle; object-fit: contain;" alt="" onerror="this.outerHTML='<svg class=\\\'svg-icon\\\' viewBox=\\\'0 0 24 24\\\' width=\\\'12\\\' height=\\\'12\\\' fill=\\\'none\\\' stroke=\\\'currentColor\\\' stroke-width=\\\'2\\\'><circle cx=\\\'12\\\' cy=\\\'12\\\' r=\\\'10\\\'></circle><line x1=\\\'2\\\' y1=\\\'12\\\' x2=\\\'22\\\' y2=\\\'12\\\'></line></svg>'" />`;
    }

    // 1. Email
    if (link.includes("mailto") || title.includes("@") || icon === "email" || icon === "✉️") {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
    }

    // 2. Phone / WhatsApp
    if (link.includes("wa.me") || link.includes("phone") || link.includes("tel") || icon === "phone" || icon === "📞") {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
    }

    // 3. Location
    if (icon === "location" || icon === "📍" || title.includes("mg") || title.includes("sp") || title.includes("rj") || title.includes("brasil") || title.includes("brazil")) {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
    }

    // 4. LinkedIn
    if (link.includes("linkedin") || title.includes("linkedin") || icon === "linkedin" || icon === "💼") {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;
    }

    // 5. GitHub
    if (link.includes("github") || title.includes("github") || icon === "github" || icon === "🐙") {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`;
    }

    // 6. Portfolio / Web
    if (link.includes("portfolio") || link.includes("http") || title.includes("portfólio") || title.includes("portfolio") || icon === "portfolio" || icon === "🌐") {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
    }

    // 7. X / Twitter
    if (link.includes("twitter") || link.includes("x.com") || title === "x" || title.includes("twitter") || icon === "x" || icon === "twitter" || icon === "𝕏") {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>`;
    }

    // 8. Instagram
    if (link.includes("instagram") || title.includes("instagram") || icon === "instagram" || icon === "📸" || icon === "📷") {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`;
    }

    // 9. Facebook
    if (link.includes("facebook") || title.includes("facebook") || icon === "facebook" || icon === "📘") {
      return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`;
    }

    // Default link SVG
    return `<svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
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
            <span class="contact-icon-glass">${svgIcon}</span>
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
