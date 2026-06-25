import { cardId } from "./card";
import type { Card, Rank } from "./types";

const SPECIAL_RANK: Record<string, number> = {
  "espada-4": 1,
  "basto-4": 2,
  "espada-7": 3,
  "oro-7": 4,
};

const TIER_RANK: Record<Rank, number> = {
  3: 5,
  2: 6,
  12: 7,
  11: 8,
  10: 9,
  7: 10,
  6: 11,
  5: 12,
  4: 13,
  1: 14,
};

const FALLBACK_TIER = 10;

export function trucoRank(card: Card): number {
  const special = SPECIAL_RANK[cardId(card)];
  if (special !== undefined) return special;
  return TIER_RANK[card.rank] ?? FALLBACK_TIER;
}
