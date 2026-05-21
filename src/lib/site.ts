export const siteBase = import.meta.env.BASE_URL;

export function pathFor(path: string) {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const base = siteBase.endsWith('/') ? siteBase : `${siteBase}/`;
  return `${base}${normalized}`;
}

export const domains = {
  Math: {
    id: 'math',
    label: 'Math',
    title: 'Mathematics',
    glyph: '∂',
    phrase: 'proof / abstraction / invariant',
    tone: 'var(--color-math)',
    darkTone: 'rgba(29, 78, 216, 0.1)',
  },
  AI: {
    id: 'ai',
    label: 'AI',
    title: 'Artificial Intelligence',
    glyph: 'λ',
    phrase: 'agency / context / optimization',
    tone: 'var(--color-ai)',
    darkTone: 'rgba(190, 24, 93, 0.1)',
  },
  Quant: {
    id: 'quant',
    label: 'Quant',
    title: 'Quantitative Thinking',
    glyph: 'σ',
    phrase: 'signal / risk / feedback',
    tone: 'var(--color-quant)',
    darkTone: 'rgba(15, 118, 110, 0.1)',
  },
  Journal: {
    id: 'journal',
    label: 'Journal',
    title: 'Journal',
    glyph: '∿',
    phrase: 'note / fragment / trace',
    tone: 'var(--color-journal)',
    darkTone: 'rgba(176, 137, 64, 0.1)',
  },
} as const;

export type DomainName = keyof typeof domains;

export function primaryDomain(tags: string[]) {
  const tag = tags.find((item): item is DomainName => item in domains);
  return tag ? domains[tag] : domains.Math;
}

export function readingMinutes(body: string) {
  const chineseChars = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWords = (body.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length;
  return Math.max(1, Math.ceil((chineseChars + latinWords * 1.7) / 420));
}
