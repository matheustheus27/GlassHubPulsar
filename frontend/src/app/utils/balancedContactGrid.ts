/**
 * Frontend Contact Link Balancing Algorithm
 * Distributes contact badges symmetrically across rows to avoid orphan/widow links.
 */

export interface ContactItem {
  title: string;
  link?: string;
  icon?: string;
}

export function estimateItemWidth(item: ContactItem, fontSizePx = 11): number {
  if (!item) return 0;
  const text = item.title || "";
  const avgCharWidth = fontSizePx * 0.58;
  const iconWidth = item.icon ? 22 : 0;
  const padding = 16;
  const gap = 12;

  return Math.round(iconWidth + (text.length * avgCharWidth) + padding + gap);
}

export function balanceContactLinks(items: ContactItem[], containerWidthPx = 680): ContactItem[][] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (items.length === 1) return [[items[0]]];

  const widths = items.map(item => estimateItemWidth(item));
  const totalWidth = widths.reduce((acc, w) => acc + w, 0);

  // 1. Single row if fits
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
    return [
      [items[0], items[1], items[2]],
      [items[3], items[4], items[5]]
    ];
  }

  // Dynamic partitioning for arbitrary lengths
  const targetRows = Math.ceil(totalWidth / containerWidthPx);
  const targetItemsPerRow = Math.ceil(n / targetRows);

  const rows: ContactItem[][] = [];
  let currentRow: ContactItem[] = [];
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
      if (movedItem) lastRow.unshift(movedItem);
    }
  }

  return rows;
}
