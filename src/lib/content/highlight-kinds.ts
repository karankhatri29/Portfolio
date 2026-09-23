export const HIGHLIGHT_KINDS = ["testimonial", "publication"] as const;
export type HighlightKind = (typeof HIGHLIGHT_KINDS)[number];
