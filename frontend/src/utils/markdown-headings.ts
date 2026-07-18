export interface MarkdownHeading {
  id: string;
  text: string;
  level: number;
}

export function slugifyHeading(text: string): string {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, '')
    .replace(/[^a-z0-9\u00c0-\u024f\u3400-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'section';
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
  const counts = new Map<string, number>();
  const headings: MarkdownHeading[] = [];
  let inCodeBlock = false;

  for (const line of content.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) {
      continue;
    }

    const text = match[2].replace(/[`*_~[\]]/g, '').trim();
    const baseId = slugifyHeading(text);
    const count = counts.get(baseId) ?? 0;
    counts.set(baseId, count + 1);

    headings.push({
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
      text,
      level: match[1].length,
    });
  }

  return headings;
}
