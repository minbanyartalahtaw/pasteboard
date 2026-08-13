const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/**
 * Reduces slide HTML to the text a reader would see, for cheap outlines.
 *
 * This is deliberately a stripper, not a parser: the output is only ever shown
 * to a model as a summary, never rendered, so malformed input degrades into
 * slightly worse text rather than anything unsafe.
 */
export function slideText(html: string, maxLength = 160): string {
  const text = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  // Trim at a word boundary so the excerpt does not end mid-word.
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}
