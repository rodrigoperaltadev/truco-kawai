import type { HandState, Player } from "./types";

/**
 * Determines the dealer and mano for a given hand number.
 * Hand 1: dealer = players[1], mano = players[0]
 * Dealer alternates each hand.
 */
export function startHandRoles(
  handNumber: number,
  players: readonly [Player, Player],
): { dealer: string; mano: string } {
  const dealerIdx = handNumber % 2 === 1 ? 1 : 0;
  const dealer = players[dealerIdx]?.id;
  const mano = players[dealerIdx === 0 ? 1 : 0]?.id;

  if (dealer === undefined || mano === undefined) {
    throw new Error("Expected two players");
  }

  return { dealer, mano };
}

/**
 * Determines who leads the next round based on the previous trick result.
 * If the trick was a tie, mano leads. Otherwise, the winner leads.
 */
export function nextRoundLeader(previousTrickWinner: string | "tie", mano: string): string {
  if (previousTrickWinner === "tie") {
    return mano;
  }
  return previousTrickWinner;
}

/**
 * Returns the current turn player from the hand state.
 * This is the player who should play next in the current round.
 */
export function currentTurn(hand: HandState): string {
  const currentRound = hand.rounds[hand.rounds.length - 1];
  if (currentRound === undefined) {
    throw new Error("Hand has no rounds");
  }

  const cardsPlayed = currentRound.trick.cardsPlayed;

  if (cardsPlayed.length === 0) {
    return determineRoundLeader(hand);
  }

  const firstPlayer = cardsPlayed[0]?.playerId;
  if (firstPlayer === undefined) {
    throw new Error("Expected a player in the trick");
  }

  const playerA = hand.players[0]?.playerId;
  const playerB = hand.players[1]?.playerId;

  if (playerA === undefined || playerB === undefined) {
    throw new Error("Expected two players in hand");
  }

  return firstPlayer === playerA ? playerB : playerA;
}

/**
 * Determines who leads the current round.
 * Round 1: mano leads.
 * Rounds 2+: winner of previous trick leads (or mano on tie).
 */
function determineRoundLeader(hand: HandState): string {
  const currentRound = hand.rounds[hand.rounds.length - 1];
  if (currentRound === undefined) {
    throw new Error("Hand has no rounds");
  }

  if (currentRound.roundNumber === 1) {
    return hand.mano;
  }

  const previousRound = hand.rounds[hand.rounds.length - 2];
  if (previousRound === undefined) {
    throw new Error("Expected previous round for round > 1");
  }

  const previousWinner = previousRound.trick.winner;
  if (previousWinner === null) {
    throw new Error("Previous round not resolved");
  }

  return nextRoundLeader(previousWinner, hand.mano);
}
