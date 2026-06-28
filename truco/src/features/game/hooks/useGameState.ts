import { useEffect, useMemo, useReducer } from "react";

import type { Card } from "@/domain/deck";
import {
  acceptCall,
  acceptEnvido,
  callEnvido,
  createMatch,
  foldHand,
  makeCall,
  playCard,
  rejectCall,
  rejectEnvido,
} from "@/domain/game";
import type {
  CallType,
  CreateMatchOptions,
  EnvidoLevel,
  MatchPhase,
  MatchState,
  PlayedCard,
} from "@/domain/game/types";

import { type GameActions, deriveActions } from "../logic/deriveActions";
export type { GameActions } from "../logic/deriveActions";
import {
  type LogEntry,
  type RawLogEntry,
  assignIds,
  callLevelLabel,
  deriveCallLogEntries,
  deriveEnvidoLogEntries,
  derivePlayLogEntries,
  envidoLevelLabel,
  foldLogEntry,
  playerName,
} from "../logic/logEntry";

// ── Public types ────────────────────────────────────────────────────

export type GameView = {
  playerHand: readonly Card[];
  opponentCardCount: number;
  currentTrick: readonly PlayedCard[];
  scores: { nos: number; ellos: number };
  handNumber: number;
  roundNumber: 1 | 2 | 3;
  isPlayerTurn: boolean;
  turnLabel: { kind: "player" } | { kind: "opponent"; name: string };
  phase: MatchPhase;
};

export type GameHandlers = {
  onPlayCard: (card: Card) => void;
  onCall: (level: CallType) => void;
  onCallEnvido: (level: EnvidoLevel) => void;
  onAccept: () => void;
  onReject: () => void;
  onMazo: () => void;
};

export type UseGameStateOptions = CreateMatchOptions & { playerId: string };

// ── Internal state & actions ────────────────────────────────────────

type InternalState = {
  matchState: MatchState;
  log: readonly LogEntry[];
  playerId: string;
};

type GameAction =
  | { type: "PLAY_CARD"; card: Card }
  | { type: "CALL"; level: CallType }
  | { type: "CALL_ENVIDO"; level: EnvidoLevel }
  | { type: "ACCEPT" }
  | { type: "REJECT" }
  | { type: "MAZO" }
  | { type: "OPPONENT_PLAY"; card: Card };

// ── Reducer ─────────────────────────────────────────────────────────

function appendEntries(
  state: InternalState,
  nextMatch: MatchState,
  rawEntries: readonly { kind: LogEntry["kind"]; actorName: string; text: string }[],
): InternalState {
  const newEntries = assignIds(rawEntries, state.log.length);
  return {
    ...state,
    matchState: nextMatch,
    log: [...state.log, ...newEntries],
  };
}

function gameReducer(state: InternalState, action: GameAction): InternalState {
  const prev = state.matchState;

  switch (action.type) {
    case "PLAY_CARD": {
      const res = playCard(prev, { playerId: state.playerId, card: action.card });
      if (!res.ok) return state;
      return appendEntries(
        { ...state, matchState: res.state },
        res.state,
        derivePlayLogEntries(prev, res.state),
      );
    }

    case "OPPONENT_PLAY": {
      const opponentId = otherPlayerId(prev, state.playerId);
      const res = playCard(prev, { playerId: opponentId, card: action.card });
      if (!res.ok) return state;
      return appendEntries(
        { ...state, matchState: res.state },
        res.state,
        derivePlayLogEntries(prev, res.state),
      );
    }

    case "CALL": {
      const res = makeCall(prev, state.playerId, action.level);
      if (!res.ok) return state;
      return appendEntries(
        { ...state, matchState: res.state },
        res.state,
        deriveCallLogEntries(prev, res.state),
      );
    }

    case "CALL_ENVIDO": {
      const res = callEnvido(prev, state.playerId, action.level);
      if (!res.ok) return state;
      return appendEntries(
        { ...state, matchState: res.state },
        res.state,
        deriveEnvidoLogEntries(prev, res.state),
      );
    }

    case "ACCEPT": {
      const responder = prev.currentTurn;
      const responderName = playerName(prev, responder);
      // Route: call pending → acceptCall; envido pending → acceptEnvido
      if (prev.hand.callState.pendingCall?.status === "pending") {
        const pending = prev.hand.callState.pendingCall;
        const res = acceptCall(prev, responder);
        if (!res.ok) return state;
        const entries: RawLogEntry[] = [
          {
            kind: "callResponse",
            actorName: responderName,
            text: `${responderName} quiso ${callLevelLabel(pending.level)}`,
          },
        ];
        return appendEntries({ ...state, matchState: res.state }, res.state, entries);
      }
      if (prev.hand.envidoState.pendingEnvido?.status === "pending") {
        const envPending = prev.hand.envidoState.pendingEnvido;
        const res = acceptEnvido(prev, responder);
        if (!res.ok) return state;
        const entries: RawLogEntry[] = [
          {
            kind: "envidoResponse",
            actorName: responderName,
            text: `${responderName} quiso ${envidoLevelLabel(envPending.level)}`,
          },
        ];
        return appendEntries({ ...state, matchState: res.state }, res.state, entries);
      }
      return state;
    }

    case "REJECT": {
      const responder = prev.currentTurn;
      const responderName = playerName(prev, responder);
      // Route: call pending → rejectCall (chains rejectEnvido); envido pending → rejectEnvido
      if (prev.hand.callState.pendingCall?.status === "pending") {
        const pending = prev.hand.callState.pendingCall;
        const res = rejectCall(prev, responder);
        if (!res.ok) return state;
        // Construct entries directly — rejectCall chains resolveMatch which resets hand history
        const entries: RawLogEntry[] = [
          {
            kind: "callResponse",
            actorName: responderName,
            text: `${responderName} no quiso ${callLevelLabel(pending.level)}`,
          },
        ];
        // If envido was also pending, rejectCall chained rejectEnvido
        if (prev.hand.envidoState.pendingEnvido?.status === "pending") {
          const envPending = prev.hand.envidoState.pendingEnvido;
          entries.push({
            kind: "envidoResponse",
            actorName: responderName,
            text: `${responderName} no quiso ${envidoLevelLabel(envPending.level)}`,
          });
        }
        return appendEntries({ ...state, matchState: res.state }, res.state, entries);
      }
      if (prev.hand.envidoState.pendingEnvido?.status === "pending") {
        const envPending = prev.hand.envidoState.pendingEnvido;
        const res = rejectEnvido(prev, responder);
        if (!res.ok) return state;
        const entries: RawLogEntry[] = [
          {
            kind: "envidoResponse",
            actorName: responderName,
            text: `${responderName} no quiso ${envidoLevelLabel(envPending.level)}`,
          },
        ];
        return appendEntries({ ...state, matchState: res.state }, res.state, entries);
      }
      return state;
    }

    case "MAZO": {
      const res = foldHand(prev, state.playerId);
      if (!res.ok) return state;
      const folderName = playerName(prev, state.playerId);
      // Construct entries directly — foldHand may chain resolveMatch which resets hand history
      const entries: RawLogEntry[] = [];
      // If call was pending, foldHand chained rejectCall
      if (prev.hand.callState.pendingCall?.status === "pending") {
        const pending = prev.hand.callState.pendingCall;
        entries.push({
          kind: "callResponse",
          actorName: folderName,
          text: `${folderName} no quiso ${callLevelLabel(pending.level)}`,
        });
        // rejectCall may also chain rejectEnvido
        if (prev.hand.envidoState.pendingEnvido?.status === "pending") {
          const envPending = prev.hand.envidoState.pendingEnvido;
          entries.push({
            kind: "envidoResponse",
            actorName: folderName,
            text: `${folderName} no quiso ${envidoLevelLabel(envPending.level)}`,
          });
        }
      } else if (prev.hand.envidoState.pendingEnvido?.status === "pending") {
        // If only envido was pending, foldHand chained rejectEnvido
        const envPending = prev.hand.envidoState.pendingEnvido;
        entries.push({
          kind: "envidoResponse",
          actorName: folderName,
          text: `${folderName} no quiso ${envidoLevelLabel(envPending.level)}`,
        });
      }
      // Fold entry always appended
      entries.push(foldLogEntry(state.playerId, prev));
      return appendEntries({ ...state, matchState: res.state }, res.state, entries);
    }

    default:
      return state;
  }
}

// ── Initializer ─────────────────────────────────────────────────────

function initGameState(opts: UseGameStateOptions): InternalState {
  const { playerId, ...matchOpts } = opts;
  return {
    matchState: createMatch(matchOpts),
    log: [],
    playerId,
  };
}

// ── Hook ────────────────────────────────────────────────────────────

const OPPONENT_DELAY_MS = 700;

export function useGameState(opts: UseGameStateOptions) {
  const [state, dispatch] = useReducer(gameReducer, opts, initGameState);
  const { matchState, playerId } = state;

  const opponentId = useMemo(() => otherPlayerId(matchState, playerId), [matchState, playerId]);

  // ── View model ──────────────────────────────────────────────────

  const view = useMemo<GameView>(() => deriveView(matchState, playerId), [matchState, playerId]);

  const actions = useMemo<GameActions>(
    () => deriveActions(matchState, playerId),
    [matchState, playerId],
  );

  const handlers = useMemo<GameHandlers>(
    () => ({
      onPlayCard: (card: Card) => dispatch({ type: "PLAY_CARD", card }),
      onCall: (level: CallType) => dispatch({ type: "CALL", level }),
      onCallEnvido: (level: EnvidoLevel) => dispatch({ type: "CALL_ENVIDO", level }),
      onAccept: () => dispatch({ type: "ACCEPT" }),
      onReject: () => dispatch({ type: "REJECT" }),
      onMazo: () => dispatch({ type: "MAZO" }),
    }),
    [],
  );

  // ── Opponent auto-play ──────────────────────────────────────────

  useEffect(() => {
    const ms = matchState;
    if (ms.currentTurn !== opponentId) return;
    if (ms.phase === "matchOver") return;

    const timer = setTimeout(() => {
      // Respond to pending calls first
      if (ms.hand.callState.pendingCall?.status === "pending") {
        dispatch(Math.random() < 0.7 ? { type: "ACCEPT" } : { type: "REJECT" });
        return;
      }
      if (ms.hand.envidoState.pendingEnvido?.status === "pending") {
        dispatch(Math.random() < 0.7 ? { type: "ACCEPT" } : { type: "REJECT" });
        return;
      }

      // Otherwise play a random card
      const opponentHand = ms.hand.players.find((p) => p.playerId === opponentId);
      if (!opponentHand || opponentHand.cards.length === 0) return;

      const cards = opponentHand.cards;
      const idx = Math.floor(Math.random() * cards.length);
      const card = cards[idx];
      if (card) {
        dispatch({ type: "OPPONENT_PLAY", card });
      }
    }, OPPONENT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [matchState, opponentId]);

  return { view, actions, handlers, log: state.log };
}

// ── Internal helpers ────────────────────────────────────────────────

function otherPlayerId(state: MatchState, playerId: string): string {
  const other = state.players.find((p) => p.id !== playerId);
  if (!other) {
    throw new Error(`Expected another player besides ${playerId}`);
  }
  return other.id;
}

function deriveView(ms: MatchState, playerId: string): GameView {
  const playerIdx = ms.hand.players.findIndex((p) => p.playerId === playerId);
  const opponentIdx = playerIdx === 0 ? 1 : 0;

  const playerHand = ms.hand.players[playerIdx];
  const opponentHand = ms.hand.players[opponentIdx];

  const playerTeam = ms.teams.find((t) => t.players[0]?.id === playerId);
  const opponentTeam = ms.teams.find((t) => t.players[0]?.id !== playerId);

  const currentRound = ms.hand.rounds[ms.hand.rounds.length - 1];
  const roundNumber = currentRound?.roundNumber ?? 1;

  const isPlayerTurn = ms.currentTurn === playerId;
  const opponentName = opponentHand
    ? (ms.players.find((p) => p.id === opponentHand.playerId)?.name ?? "")
    : "";

  return {
    playerHand: playerHand?.cards ?? [],
    opponentCardCount: opponentHand?.cards.length ?? 0,
    currentTrick: currentRound?.trick.cardsPlayed ?? [],
    scores: {
      nos: playerTeam?.score ?? 0,
      ellos: opponentTeam?.score ?? 0,
    },
    handNumber: ms.hand.handNumber,
    roundNumber,
    isPlayerTurn,
    turnLabel: isPlayerTurn ? { kind: "player" } : { kind: "opponent", name: opponentName },
    phase: ms.phase,
  };
}
