import { isEnvidoWindowOpen } from "@/domain/game/envido";
import type { MatchState } from "@/domain/game/types";

/**
 * Gated action flags. Each `true` means the corresponding button should be rendered.
 * Buttons are OMITTED (not disabled) when false — per spec.
 */
export type GameActions = {
  truco: boolean;
  retruco: boolean;
  valeCuatro: boolean;
  envido: boolean;
  realEnvido: boolean;
  faltaEnvido: boolean;
  quiero: boolean;
  noQuiero: boolean;
  mazo: boolean;
};

/**
 * Pure selector that derives which actions are available for the given player.
 * Mirrors domain validation order so that gated actions always correspond to
 * domain calls that would succeed.
 *
 * Returns all-false when phase is "matchOver".
 */
export function deriveActions(state: MatchState, playerId: string): GameActions {
  if (state.phase === "matchOver") {
    return allFalse();
  }

  const turn = state.currentTurn === playerId;
  const call = state.hand.callState;
  const env = state.hand.envidoState;

  const callPending = call.pendingCall?.status === "pending";
  const envPending = env.pendingEnvido?.status === "pending";

  const pendingFromOpponent =
    (callPending && call.pendingCall?.caller !== playerId) ||
    (envPending && env.pendingEnvido?.caller !== playerId);

  const envidoOpen = isEnvidoWindowOpen(state, playerId);
  const canInitiate = turn && !callPending && !envPending;

  return {
    truco: canInitiate && call.acceptedLevel === null,
    retruco: canInitiate && call.acceptedLevel === "truco",
    valeCuatro: canInitiate && call.acceptedLevel === "retruco",
    envido: canInitiate && envidoOpen,
    realEnvido: canInitiate && envidoOpen,
    faltaEnvido: canInitiate && envidoOpen,
    quiero: turn && pendingFromOpponent,
    noQuiero: turn && pendingFromOpponent,
    mazo: canInitiate,
  };
}

function allFalse(): GameActions {
  return {
    truco: false,
    retruco: false,
    valeCuatro: false,
    envido: false,
    realEnvido: false,
    faltaEnvido: false,
    quiero: false,
    noQuiero: false,
    mazo: false,
  };
}
