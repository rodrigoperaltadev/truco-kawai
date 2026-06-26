import { trucoRank } from "@/domain/deck";
import type { TrickState, TrickWinner } from "./types";

/**
 * Compares the trucoRank of the two cards in a completed trick.
 * Lower trucoRank value = stronger card. Equal values → "tie".
 *
 * Precondition: trick.cardsPlayed has exactly 2 entries.
 */
export function resolveTrick(trick: TrickState): TrickWinner {
  const a = trick.cardsPlayed[0];
  const b = trick.cardsPlayed[1];

  if (a === undefined || b === undefined) {
    throw new Error("resolveTrick requires exactly 2 cards played");
  }

  const rankA = trucoRank(a.card);
  const rankB = trucoRank(b.card);

  if (rankA < rankB) return a.playerId;
  if (rankB < rankA) return b.playerId;
  return "tie";
}
