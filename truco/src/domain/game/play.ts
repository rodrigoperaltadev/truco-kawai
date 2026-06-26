import { cardId } from "@/domain/deck";
import { resolveHand } from "./hand";
import { getPlayedCardIds, resolveMatch } from "./match";
import { resolveTrick } from "./trick";
import { nextRoundLeader } from "./turn";
import type {
  HandState,
  MatchState,
  PlayCardCmd,
  PlayerHand,
  Result,
  RoundState,
  TrickState,
} from "./types";

/**
 * Plays a card. Returns a new MatchState on success, or a PlayError on rule violation.
 * Never mutates the input state.
 *
 * Validation order: MATCH_OVER → OUT_OF_TURN → CARD_NOT_IN_HAND → CARD_ALREADY_PLAYED.
 */
export function playCard(state: MatchState, cmd: PlayCardCmd): Result<MatchState> {
  if (state.phase === "matchOver") {
    return { ok: false, error: "MATCH_OVER" };
  }

  if (cmd.playerId !== state.currentTurn) {
    return { ok: false, error: "OUT_OF_TURN" };
  }

  const playerHand = findPlayerHand(state.hand, cmd.playerId);
  if (playerHand === undefined) {
    return { ok: false, error: "CARD_NOT_IN_HAND" };
  }

  const cid = cardId(cmd.card);
  const inHand = playerHand.cards.some((c) => cardId(c) === cid);
  if (!inHand) {
    return { ok: false, error: "CARD_NOT_IN_HAND" };
  }

  const playedIds = getPlayedCardIds(state.hand);
  if (playedIds.has(cid)) {
    return { ok: false, error: "CARD_ALREADY_PLAYED" };
  }

  // --- All validations passed: apply the play ---
  const currentRound = state.hand.rounds[state.hand.rounds.length - 1];
  if (currentRound === undefined) {
    throw new Error("Expected current round");
  }

  const updatedPlayerHand: PlayerHand = {
    ...playerHand,
    cards: playerHand.cards.filter((c) => cardId(c) !== cid),
  };
  const newPlayers = replacePlayerHand(state.hand.players, updatedPlayerHand);
  const newTrickCards = [
    ...currentRound.trick.cardsPlayed,
    { playerId: cmd.playerId, card: cmd.card },
  ];

  // Trick incomplete → wait for other player
  if (newTrickCards.length < 2) {
    const incompleteRound: RoundState = {
      ...currentRound,
      trick: { ...currentRound.trick, cardsPlayed: newTrickCards },
    };
    const newHand: HandState = {
      ...state.hand,
      players: newPlayers,
      rounds: replaceLast(state.hand.rounds, incompleteRound),
    };
    const nextPlayer = otherPlayer(state.hand, cmd.playerId);
    return { ok: true, state: { ...state, hand: newHand, currentTurn: nextPlayer } };
  }

  // Trick complete → resolve winner
  const completedTrick: TrickState = {
    cardsPlayed: newTrickCards,
    winner: null,
    resolved: false,
  };
  const trickWinner = resolveTrick(completedTrick);

  const resolvedRound: RoundState = {
    ...currentRound,
    trick: { cardsPlayed: newTrickCards, winner: trickWinner, resolved: true },
  };
  const roundsAfterResolve = replaceLast(state.hand.rounds, resolvedRound);

  // Hand complete? (someone has 2 wins or all 3 rounds resolved)
  if (isHandDecided(roundsAfterResolve, state.hand)) {
    const completedHand: HandState = {
      ...state.hand,
      players: newPlayers,
      rounds: roundsAfterResolve,
    };
    const handWinner = resolveHand(completedHand);
    // "draw" is defensive; mano tie-break always resolves in standard rules.
    const winnerId = handWinner === "draw" ? state.hand.mano : handWinner;
    const stateWithCompletedHand: MatchState = { ...state, hand: completedHand };
    return { ok: true, state: resolveMatch(stateWithCompletedHand, winnerId) };
  }

  // Hand not done → start next round
  const nextRoundNum = (resolvedRound.roundNumber + 1) as 2 | 3;
  const nextRound: RoundState = {
    roundNumber: nextRoundNum,
    trick: { cardsPlayed: [], winner: null, resolved: false },
  };
  const allRounds = [...roundsAfterResolve, nextRound];
  const newHand: HandState = { ...state.hand, players: newPlayers, rounds: allRounds };
  const leader = nextRoundLeader(trickWinner, state.hand.mano);

  return { ok: true, state: { ...state, hand: newHand, currentTurn: leader } };
}

// ── Internal helpers ──────────────────────────────────────────────────

function findPlayerHand(hand: HandState, playerId: string): PlayerHand | undefined {
  return hand.players.find((p) => p.playerId === playerId);
}

function replacePlayerHand(
  players: readonly [PlayerHand, PlayerHand],
  updated: PlayerHand,
): readonly [PlayerHand, PlayerHand] {
  const p0 = players[0];
  const p1 = players[1];
  if (p0 === undefined || p1 === undefined) {
    throw new Error("Expected two player hands");
  }
  return [
    p0.playerId === updated.playerId ? updated : p0,
    p1.playerId === updated.playerId ? updated : p1,
  ];
}

function replaceLast<T>(arr: readonly T[], replacement: T): T[] {
  return [...arr.slice(0, -1), replacement];
}

function otherPlayer(hand: HandState, playerId: string): string {
  const other = hand.players.find((p) => p.playerId !== playerId);
  if (other === undefined) {
    throw new Error("Expected another player");
  }
  return other.playerId;
}

/**
 * A hand is decided when a player has 2+ trick wins, or all 3 rounds are resolved.
 */
function isHandDecided(rounds: readonly RoundState[], hand: HandState): boolean {
  const p0 = hand.players[0]?.playerId;
  const p1 = hand.players[1]?.playerId;
  if (p0 === undefined || p1 === undefined) return false;

  let winsA = 0;
  let winsB = 0;
  let resolvedCount = 0;

  for (const round of rounds) {
    if (!round.trick.resolved) continue;
    resolvedCount++;
    const w = round.trick.winner;
    if (w === p0) winsA++;
    else if (w === p1) winsB++;
  }

  if (winsA >= 2 || winsB >= 2) return true;
  if (resolvedCount >= 3) return true;
  return false;
}
