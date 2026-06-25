import type { Card } from "./types";

export function cardId(card: Card): string {
  return `${card.suit}-${card.rank}`;
}
