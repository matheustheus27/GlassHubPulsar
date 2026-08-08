export function convertTagToHtml(text = "") {
    if (!text) return "";
    
    let processed = text
      // BOLD
      .replace(/<BOLD>(.*?)<\/BOLD>/gi, "<strong>$1</strong>")
      // ITALIC
      .replace(/<ITALIC>(.*?)<\/ITALIC>/gi, "<em>$1</em>")
      // UNDERLINE
      .replace(/<UNDERLINE>(.*?)<\/UNDERLINE>/gi, "<u>$1</u>")
      // HIGHLIGHT
      .replace(/<HIGHLIGHT>(.*?)<\/HIGHLIGHT>/gi, '<mark style="background-color: rgba(251, 191, 36, 0.3); padding: 2px 4px; border-radius: 2px;">$1</mark>')
      // STRIKETHROUGH
      .replace(/<STRIKETHROUGH>(.*?)<\/STRIKETHROUGH>/gi, "<s>$1</s>");
    
    return processed;
}

export function processInHtml(html = "") {
    if (!html) return "";
    return convertTagToHtml(html);
}