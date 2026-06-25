export type Suit = "espada" | "basto" | "copa" | "oro";

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export type Card = Readonly<{ suit: Suit; rank: Rank }>;

export type SuitMeta = Readonly<{ label: string; accentColor: string }>;
