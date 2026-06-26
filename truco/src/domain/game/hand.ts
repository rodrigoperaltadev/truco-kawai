import type { HandState, HandWinner } from "./types";

/**
 * Resolves the winner of a hand using best-of-3 logic.
 *
 * | Tricks won (A / B) | Winner              |
 * |--------------------|----------------------|
 * | 2–0 or 2–1         | Player with 2 wins   |
 * | 1–1, 3rd = tie     | Mano                 |
 * | 1–0, other ties    | Player with 1 win    |
 * | 0–0, all ties      | Mano                 |
 *
 * "draw" is defensive — under standard rules mano tie-break always resolves.
 */
export function resolveHand(hand: HandState): HandWinner {
  const playerA = hand.players[0];
  const playerB = hand.players[1];

  if (playerA === undefined || playerB === undefined) {
    throw new Error("Expected two players in hand");
  }

  let winsA = 0;
  let winsB = 0;

  for (const round of hand.rounds) {
    if (!round.trick.resolved) continue;
    const w = round.trick.winner;
    if (w === playerA.playerId) winsA++;
    else if (w === playerB.playerId) winsB++;
    // "tie" contributes to neither
  }

  if (winsA >= 2) return playerA.playerId;
  if (winsB >= 2) return playerB.playerId;

  // No one reached 2 wins.
  // 0-0 (all ties) or 1-1 (with 3rd tie) → mano wins.
  if (winsA === winsB) return hand.mano;

  // 1-0 or 0-1 with remaining rounds tied → player with more wins.
  return winsA > winsB ? playerA.playerId : playerB.playerId;
}
