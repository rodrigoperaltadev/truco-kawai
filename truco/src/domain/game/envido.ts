import type { Card, Rank } from "@/domain/deck";
import { faltaPoints, scoreEnvido } from "./match";
import type {
  EnvidoHistoryEntry,
  EnvidoLevel,
  EnvidoState,
  HandState,
  MatchState,
  Result,
} from "./types";

/**
 * Returns the envido point value for a given card rank.
 * 1-3 → rank, 4/5 → 0, 6/7 → rank, 10/11/12 → 0.
 */
export function envidoCardValue(rank: Rank): number {
  switch (rank) {
    case 1:
    case 2:
    case 3:
    case 6:
    case 7:
      return rank;
    case 4:
    case 5:
    case 10:
    case 11:
    case 12:
      return 0;
  }
}

/**
 * Computes envido points for a set of cards (typically 3).
 * Two same-suit: sum of two highest same-suit values + 20.
 * No same-suit pair: highest single card value.
 * Maximum reachable: 33 (7 + 6 + 20).
 */
export function calcEnvidoPoints(cards: readonly Card[]): number {
  // Group by suit
  const bySuit = new Map<string, number[]>();
  for (const card of cards) {
    const val = envidoCardValue(card.rank);
    const existing = bySuit.get(card.suit);
    if (existing !== undefined) {
      existing.push(val);
    } else {
      bySuit.set(card.suit, [val]);
    }
  }

  // Find the best same-suit pair
  let bestPairSum = -1;
  for (const values of bySuit.values()) {
    if (values.length >= 2) {
      const sorted = [...values].sort((a, b) => b - a);
      const pairSum = (sorted[0] as number) + (sorted[1] as number);
      if (pairSum > bestPairSum) {
        bestPairSum = pairSum;
      }
    }
  }

  if (bestPairSum >= 0) {
    return bestPairSum + 20;
  }

  // No same-suit pair: highest single card value
  let highest = 0;
  for (const card of cards) {
    const val = envidoCardValue(card.rank);
    if (val > highest) {
      highest = val;
    }
  }
  return highest;
}

/**
 * Returns the base points for an envido level.
 * envido → 2, real_envido → 3, falta_envido → 0 (uses faltaPoints instead).
 */
export function levelPoints(level: EnvidoLevel): number {
  switch (level) {
    case "envido":
      return 2;
    case "real_envido":
      return 3;
    case "falta_envido":
      return 0;
  }
}

/**
 * Checks if the envido calling window is open.
 * Must be round 1, caller hasn't played in current trick, envido not resolved.
 */
export function isEnvidoWindowOpen(state: MatchState, caller: string): boolean {
  if (state.hand.envidoState.resolved) return false;

  const currentRound = state.hand.rounds[state.hand.rounds.length - 1];
  if (currentRound === undefined) return true;
  if (currentRound.roundNumber !== 1) return false;

  // Caller must not have played a card in the current trick
  const hasPlayed = currentRound.trick.cardsPlayed.some((pc) => pc.playerId === caller);
  return !hasPlayed;
}

/**
 * Validates envido level escalation.
 * null → {envido, real_envido, falta_envido}
 * envido → {real_envido, falta_envido}
 * real_envido → {falta_envido}
 */
export function isValidEnvidoLevel(
  currentAccepted: EnvidoLevel | null,
  newLevel: EnvidoLevel,
): boolean {
  if (currentAccepted === null) {
    return newLevel === "envido" || newLevel === "real_envido" || newLevel === "falta_envido";
  }
  if (currentAccepted === "envido") {
    return newLevel === "real_envido" || newLevel === "falta_envido";
  }
  if (currentAccepted === "real_envido") {
    return newLevel === "falta_envido";
  }
  // falta_envido is the max — no further escalation
  return false;
}

/**
 * Issues an envido call.
 *
 * Validation order:
 *   MATCH_OVER → OUT_OF_TURN → CALL_PENDING → ENVIDO_CALL_PENDING →
 *   ENVIDO_WINDOW_CLOSED → ENVIDO_INVALID_LEVEL
 *
 * On success: sets pendingEnvido, appends history, transfers currentTurn to opponent.
 */
export function callEnvido(
  state: MatchState,
  caller: string,
  level: EnvidoLevel,
): Result<MatchState> {
  if (state.phase === "matchOver") {
    return { ok: false, error: "MATCH_OVER" };
  }

  if (caller !== state.currentTurn) {
    return { ok: false, error: "OUT_OF_TURN" };
  }

  // Truco call pending blocks envido
  if (state.hand.callState.pendingCall?.status === "pending") {
    return { ok: false, error: "CALL_PENDING" };
  }

  // Envido already pending
  if (state.hand.envidoState.pendingEnvido?.status === "pending") {
    return { ok: false, error: "ENVIDO_CALL_PENDING" };
  }

  // Window check: round 1, caller hasn't played, not resolved
  if (!isEnvidoWindowOpen(state, caller)) {
    return { ok: false, error: "ENVIDO_WINDOW_CLOSED" };
  }

  // Level escalation check
  if (!isValidEnvidoLevel(state.hand.envidoState.acceptedLevel, level)) {
    return { ok: false, error: "ENVIDO_INVALID_LEVEL" };
  }

  const pendingEnvido = { caller, level, status: "pending" as const };
  const historyEntry: EnvidoHistoryEntry = {
    actor: caller,
    level,
    action: "issued",
    round: currentRoundNumber(state.hand),
  };
  const newEnvidoState: EnvidoState = {
    pendingEnvido,
    acceptedLevel: state.hand.envidoState.acceptedLevel,
    stake: state.hand.envidoState.stake,
    resolved: false,
    history: [...state.hand.envidoState.history, historyEntry],
  };
  const newHand: HandState = { ...state.hand, envidoState: newEnvidoState };
  const opponent = otherPlayer(state, caller);

  return { ok: true, state: { ...state, hand: newHand, currentTurn: opponent } };
}

/**
 * Accepts the pending envido.
 * Compares both players' envido points; higher wins, tie → mano wins.
 * Awards points via scoreEnvido, sets resolved=true, currentTurn → caller.
 */
export function acceptEnvido(state: MatchState, responder: string): Result<MatchState> {
  if (state.phase === "matchOver") {
    return { ok: false, error: "MATCH_OVER" };
  }

  const pending = state.hand.envidoState.pendingEnvido;
  if (pending === null) {
    return { ok: false, error: "ENVIDO_WINDOW_CLOSED" };
  }

  if (responder !== state.currentTurn) {
    return { ok: false, error: "OUT_OF_TURN" };
  }

  // Compute points for both players
  const callerHand = getPlayerCards(state.hand, pending.caller);
  const responderHand = getPlayerCards(state.hand, responder);
  const callerPoints = calcEnvidoPoints(callerHand);
  const responderPoints = calcEnvidoPoints(responderHand);

  // Determine winner: higher points wins, tie → mano
  const mano = state.hand.mano;
  let winnerId: string;
  if (callerPoints > responderPoints) {
    winnerId = pending.caller;
  } else if (responderPoints > callerPoints) {
    winnerId = responder;
  } else {
    // Tie → mano wins
    winnerId = mano;
  }

  // Calculate points to award
  const pendingLevel = pending.level;
  let awarded: number;
  if (pendingLevel === "falta_envido") {
    const winnerTeamIdx = state.teams.findIndex((t) => t.players[0]?.id === winnerId);
    awarded = faltaPoints(state, winnerTeamIdx);
  } else {
    awarded = state.hand.envidoState.stake + levelPoints(pendingLevel);
  }

  // Record acceptance in history
  const historyEntry: EnvidoHistoryEntry = {
    actor: responder,
    level: pendingLevel,
    action: "accepted",
    round: currentRoundNumber(state.hand),
  };
  const newEnvidoState: EnvidoState = {
    pendingEnvido: null,
    acceptedLevel: pendingLevel,
    stake: awarded,
    resolved: true,
    history: [...state.hand.envidoState.history, historyEntry],
  };
  const newHand: HandState = { ...state.hand, envidoState: newEnvidoState };
  const stateWithEnvido: MatchState = { ...state, hand: newHand };

  // Score and return turn to caller
  const scored = scoreEnvido(stateWithEnvido, winnerId, awarded);
  return { ok: true, state: { ...scored, currentTurn: pending.caller } };
}

/**
 * Rejects the pending envido.
 * Caller wins rejection points. Sets resolved=true, currentTurn → opponent (ex-caller).
 */
export function rejectEnvido(state: MatchState, responder: string): Result<MatchState> {
  if (state.phase === "matchOver") {
    return { ok: false, error: "MATCH_OVER" };
  }

  const pending = state.hand.envidoState.pendingEnvido;
  if (pending === null) {
    return { ok: false, error: "ENVIDO_WINDOW_CLOSED" };
  }

  if (responder !== state.currentTurn) {
    return { ok: false, error: "OUT_OF_TURN" };
  }

  const caller = pending.caller;
  const pendingLevel = pending.level;

  let awarded: number;
  if (pendingLevel === "falta_envido") {
    const callerTeamIdx = state.teams.findIndex((t) => t.players[0]?.id === caller);
    awarded = faltaPoints(state, callerTeamIdx);
  } else {
    // Rejection pays: max(stake + 1, levelPoints(pendingLevel) - 1)
    // This handles both cold calls (real_envido=2) and escalated calls (stake+1)
    awarded = Math.max(state.hand.envidoState.stake + 1, levelPoints(pendingLevel) - 1);
  }

  // Record rejection in history
  const historyEntry: EnvidoHistoryEntry = {
    actor: responder,
    level: pendingLevel,
    action: "rejected",
    round: currentRoundNumber(state.hand),
  };
  const newEnvidoState: EnvidoState = {
    pendingEnvido: null,
    acceptedLevel: state.hand.envidoState.acceptedLevel,
    stake: awarded,
    resolved: true,
    history: [...state.hand.envidoState.history, historyEntry],
  };
  const newHand: HandState = { ...state.hand, envidoState: newEnvidoState };
  const stateWithEnvido: MatchState = { ...state, hand: newHand };

  // Caller wins rejection points; turn goes to opponent (the ex-caller now plays)
  const scored = scoreEnvido(stateWithEnvido, caller, awarded);
  const opponent = otherPlayer(state, responder);
  return { ok: true, state: { ...scored, currentTurn: opponent } };
}

// ── Internal helpers ──────────────────────────────────────────────────

function currentRoundNumber(hand: HandState): number {
  const currentRound = hand.rounds[hand.rounds.length - 1];
  if (currentRound === undefined) return 1;
  return currentRound.roundNumber;
}

function otherPlayer(state: MatchState, playerId: string): string {
  const other = state.hand.players.find((p) => p.playerId !== playerId);
  if (other === undefined) {
    throw new Error("Expected another player");
  }
  return other.playerId;
}

function getPlayerCards(hand: HandState, playerId: string): readonly Card[] {
  const playerHand = hand.players.find((p) => p.playerId === playerId);
  if (playerHand === undefined) {
    throw new Error(`Player ${playerId} not found in hand`);
  }
  return playerHand.cards;
}
