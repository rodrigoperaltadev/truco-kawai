import { resolveMatch } from "./match";
import type {
  CallHistoryEntry,
  CallState,
  CallType,
  HandState,
  MatchState,
  Result,
} from "./types";

/**
 * Returns the point value for a given call level.
 * null → 1 (base hand), truco → 2, retruco → 3, vale_cuatro → 4.
 */
export function callPoints(level: CallType | null): number {
  switch (level) {
    case "truco":
      return 2;
    case "retruco":
      return 3;
    case "vale_cuatro":
      return 4;
    case null:
      return 1;
  }
}

/**
 * Returns the next escalation level, or null if already at max.
 * null → truco → retruco → vale_cuatro → null.
 */
export function nextLevel(level: CallType | null): CallType | null {
  switch (level) {
    case null:
      return "truco";
    case "truco":
      return "retruco";
    case "retruco":
      return "vale_cuatro";
    case "vale_cuatro":
      return null;
  }
}

/**
 * Issues a call (truco, retruco, or vale_cuatro).
 *
 * Validation order:
 *   MATCH_OVER → OUT_OF_TURN → CALL_ALREADY_PENDING → CALL_WINDOW_CLOSED → INVALID_CALL_LEVEL
 *
 * On success: sets pendingCall, appends history entry, transfers currentTurn to opponent.
 */
export function makeCall(state: MatchState, caller: string, level: CallType): Result<MatchState> {
  if (state.phase === "matchOver") {
    return { ok: false, error: "MATCH_OVER" };
  }

  if (caller !== state.currentTurn) {
    return { ok: false, error: "OUT_OF_TURN" };
  }

  if (state.hand.callState.pendingCall?.status === "pending") {
    return { ok: false, error: "CALL_ALREADY_PENDING" };
  }

  if (hasCallerPlayedInCurrentTrick(state.hand, caller)) {
    return { ok: false, error: "CALL_WINDOW_CLOSED" };
  }

  if (level !== nextLevel(state.hand.callState.acceptedLevel)) {
    return { ok: false, error: "INVALID_CALL_LEVEL" };
  }

  const pendingCall = { caller, level, status: "pending" as const };
  const historyEntry: CallHistoryEntry = {
    caller,
    level,
    action: "issued",
    resolvedAt: currentRoundNumber(state.hand),
  };
  const newCallState: CallState = {
    pendingCall,
    acceptedLevel: state.hand.callState.acceptedLevel,
    history: [...state.hand.callState.history, historyEntry],
  };
  const newHand: HandState = { ...state.hand, callState: newCallState };
  const opponent = otherPlayer(state, caller);

  return { ok: true, state: { ...state, hand: newHand, currentTurn: opponent } };
}

/**
 * Accepts the pending call.
 * Requires responder === currentTurn and a pending call exists.
 *
 * On success: sets status to "accepted", updates acceptedLevel, appends history,
 * transfers currentTurn back to the original caller.
 */
export function acceptCall(state: MatchState, responder: string): Result<MatchState> {
  if (state.phase === "matchOver") {
    return { ok: false, error: "MATCH_OVER" };
  }

  const pending = state.hand.callState.pendingCall;
  if (pending === null) {
    return { ok: false, error: "CALL_WINDOW_CLOSED" };
  }

  if (responder !== state.currentTurn) {
    return { ok: false, error: "OUT_OF_TURN" };
  }

  const acceptedCall = { ...pending, status: "accepted" as const };
  const historyEntry: CallHistoryEntry = {
    caller: responder,
    level: pending.level,
    action: "accepted",
    resolvedAt: currentRoundNumber(state.hand),
  };
  const newCallState: CallState = {
    pendingCall: acceptedCall,
    acceptedLevel: pending.level,
    history: [...state.hand.callState.history, historyEntry],
  };
  const newHand: HandState = { ...state.hand, callState: newCallState };

  return { ok: true, state: { ...state, hand: newHand, currentTurn: pending.caller } };
}

/**
 * Rejects the pending call.
 * Requires responder === currentTurn and a pending call exists.
 *
 * On reject: appends history, computes override = callPoints(acceptedLevel before this call),
 * calls resolveMatch with the caller's player id and the override.
 */
export function rejectCall(state: MatchState, responder: string): Result<MatchState> {
  if (state.phase === "matchOver") {
    return { ok: false, error: "MATCH_OVER" };
  }

  const pending = state.hand.callState.pendingCall;
  if (pending === null) {
    return { ok: false, error: "CALL_WINDOW_CLOSED" };
  }

  if (responder !== state.currentTurn) {
    return { ok: false, error: "OUT_OF_TURN" };
  }

  const historyEntry: CallHistoryEntry = {
    caller: responder,
    level: pending.level,
    action: "rejected",
    resolvedAt: currentRoundNumber(state.hand),
  };
  const newCallState: CallState = {
    pendingCall: { ...pending, status: "rejected" as const },
    acceptedLevel: state.hand.callState.acceptedLevel,
    history: [...state.hand.callState.history, historyEntry],
  };
  const newHand: HandState = { ...state.hand, callState: newCallState };
  const stateWithHistory: MatchState = { ...state, hand: newHand };

  const override = callPoints(state.hand.callState.acceptedLevel);
  return { ok: true, state: resolveMatch(stateWithHistory, pending.caller, override) };
}

// ── Internal helpers ──────────────────────────────────────────────────

function hasCallerPlayedInCurrentTrick(hand: HandState, playerId: string): boolean {
  const currentRound = hand.rounds[hand.rounds.length - 1];
  if (currentRound === undefined) return false;
  return currentRound.trick.cardsPlayed.some((pc) => pc.playerId === playerId);
}

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
