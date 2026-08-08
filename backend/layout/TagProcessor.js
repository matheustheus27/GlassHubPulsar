/**
 * Processes custom formatting tags in the text
 *
 * Supported tags:
 * - <BOLD>text</BOLD> → <strong>text</strong>
 * - <ITALIC>text</ITALIC> → <em>text</em>
 * - <UNDERLINE>text</UNDERLINE> → <u>text</u>
 * - <HIGHLIGHT>text</HIGHLIGHT> → <mark>text</mark>
 * - <STRIKETHROUGH>text</STRIKETHROUGH> → <s>text</s>
 */
class TagProcessor {
  /**
   * Removes custom tags from the text (keeping only the content)
   * Useful for calculating height without counting the characters in the tags
   */
  static stripTags(text = "") {
    if (!text) return "";
    
    return text
      .replace(/<BOLD>(.*?)<\/BOLD>/gi, "$1")
      .replace(/<ITALIC>(.*?)<\/ITALIC>/gi, "$1")
      .replace(/<UNDERLINE>(.*?)<\/UNDERLINE>/gi, "$1")
      .replace(/<HIGHLIGHT>(.*?)<\/HIGHLIGHT>/gi, "$1")
      .replace(/<STRIKETHROUGH>(.*?)<\/STRIKETHROUGH>/gi, "$1");
  }

  /**
   * Processes custom tags and converts them to HTML
   */
  static process(text = "") {
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

  /**
   * Processes tags within HTML while preserving other tags
   * Useful when the text already contains HTML (such as bullets in lists)
   */
  static processInHtml(html = "") {
    if (!html) return "";
    return this.process(html);
  }
}

module.exports = TagProcessor;
