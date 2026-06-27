import { rejectCall } from "./calls";
import { rejectEnvido } from "./envido";
import { resolveMatch } from "./match";
import type { MatchState, Result } from "./types";

/**
 * Player concedes the current hand ("me voy al mazo").
 *
 * Validation: MATCH_OVER → OUT_OF_TURN.
 * Scoring (in order):
 *   1. Truco pending → rejectCall (caller wins callPoints(acceptedLevel); no extra fold penalty).
 *   2. Envido pending (no truco) → rejectEnvido + resolveMatch(opponent, 1).
 *   3. Round 1, no cards played, folder is mano → resolveMatch(opponent, 2).
 *   4. Else → resolveMatch(opponent, 1).
 *
 * Always resolves the hand via resolveMatch (next hand dealt or matchOver).
 */
export function foldHand(state: MatchState, folderId: string): Result<MatchState> {
  if (state.phase === "matchOver") {
    return { ok: false, error: "MATCH_OVER" };
  }

  if (folderId !== state.currentTurn) {
    return { ok: false, error: "OUT_OF_TURN" };
  }

  const opponentId = otherPlayer(state, folderId);

  // Branch 1: truco pending → delegate to rejectCall
  if (state.hand.callState.pendingCall?.status === "pending") {
    return rejectCall(state, folderId);
  }

  // Branch 2: envido pending (no truco) → rejectEnvido then fold +1 to opponent
  if (state.hand.envidoState.pendingEnvido?.status === "pending") {
    const envResult = rejectEnvido(state, folderId);
    if (!envResult.ok) {
      return envResult;
    }
    return { ok: true, state: resolveMatch(envResult.state, opponentId, 1) };
  }

  // Branch 3: round 1, no cards played, folder is mano → opponent +2
  const currentRound = state.hand.rounds[state.hand.rounds.length - 1];
  const isRound1 = state.hand.rounds.length === 1;
  const noCardsPlayed = currentRound !== undefined && currentRound.trick.cardsPlayed.length === 0;
  if (isRound1 && noCardsPlayed && folderId === state.hand.mano) {
    return { ok: true, state: resolveMatch(state, opponentId, 2) };
  }

  // Branch 4: else → opponent +1
  return { ok: true, state: resolveMatch(state, opponentId, 1) };
}

// ── Internal helpers ──────────────────────────────────────────────────

function otherPlayer(state: MatchState, playerId: string): string {
  const other = state.hand.players.find((p) => p.playerId !== playerId);
  if (other === undefined) {
    throw new Error("Expected another player");
  }
  return other.playerId;
}
