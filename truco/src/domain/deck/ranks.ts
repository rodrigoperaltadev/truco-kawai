export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const;

export type Rank = (typeof RANKS)[number];
