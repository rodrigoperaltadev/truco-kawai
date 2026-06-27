import type { Card } from "@/domain/deck";

export type Player = Readonly<{ id: string; name: string }>;

export type Team = Readonly<{
  id: string;
  players: readonly [Player];
  score: number;
}>;

export type MatchPhase = "playing" | "matchOver";

export type PointsToWin = 15 | 30;

export type TrickWinner = string | "tie";

export type HandWinner = string | "draw";

export type PlayedCard = Readonly<{
  playerId: string;
  card: Card;
}>;

export type TrickState = Readonly<{
  cardsPlayed: readonly PlayedCard[];
  winner: TrickWinner | null;
  resolved: boolean;
}>;

export type RoundState = Readonly<{
  roundNumber: 1 | 2 | 3;
  trick: TrickState;
}>;

export type PlayerHand = Readonly<{
  playerId: string;
  cards: readonly Card[];
}>;

export type HandState = Readonly<{
  handNumber: number;
  dealer: string;
  mano: string;
  players: readonly [PlayerHand, PlayerHand];
  rounds: readonly RoundState[];
  callState: CallState;
  envidoState: EnvidoState;
}>;

export type MatchState = Readonly<{
  phase: MatchPhase;
  pointsToWin: PointsToWin;
  players: readonly [Player, Player];
  teams: readonly [Team, Team];
  hand: HandState;
  currentTurn: string;
  winner: string | null;
}>;

export type CreateMatchOptions = Readonly<{
  players: readonly [Player, Player];
  pointsToWin: PointsToWin;
  rng?: () => number;
  florEnabled?: boolean;
}>;

export type PlayCardCmd = Readonly<{
  playerId: string;
  card: Card;
}>;

// ── Call escalation types ─────────────────────────────────────────────

export type CallType = "truco" | "retruco" | "vale_cuatro";
export type CallStatus = "pending" | "accepted" | "rejected";
export type CallAction = "issued" | "accepted" | "rejected";

export type PendingCall = Readonly<{
  caller: string;
  level: CallType;
  status: CallStatus;
}>;

export type CallHistoryEntry = Readonly<{
  caller: string;
  level: CallType;
  action: CallAction;
  resolvedAt: number;
}>;

export type CallState = Readonly<{
  pendingCall: PendingCall | null;
  acceptedLevel: CallType | null;
  history: readonly CallHistoryEntry[];
}>;

// ── Envido types ────────────────────────────────────────────────────

export type EnvidoLevel = "envido" | "real_envido" | "falta_envido";
export type EnvidoAction = "issued" | "accepted" | "rejected";

export type PendingEnvido = Readonly<{
  caller: string;
  level: EnvidoLevel;
  status: "pending";
}>;

export type EnvidoHistoryEntry = Readonly<{
  actor: string;
  level: EnvidoLevel;
  action: EnvidoAction;
  round: number;
}>;

export type EnvidoState = Readonly<{
  pendingEnvido: PendingEnvido | null;
  acceptedLevel: EnvidoLevel | null;
  stake: number;
  resolved: boolean;
  history: readonly EnvidoHistoryEntry[];
}>;

// ── Error types ───────────────────────────────────────────────────────

export type GameError =
  | "MATCH_OVER"
  | "CALL_PENDING"
  | "OUT_OF_TURN"
  | "CARD_NOT_IN_HAND"
  | "CARD_ALREADY_PLAYED"
  | "INVALID_CALL_LEVEL"
  | "CALL_ALREADY_PENDING"
  | "CALL_WINDOW_CLOSED"
  | "ENVIDO_CALL_PENDING"
  | "ENVIDO_WINDOW_CLOSED"
  | "ENVIDO_ALREADY_RESOLVED"
  | "ENVIDO_INVALID_LEVEL";

export type PlayError = GameError;

export type Result<T> =
  | Readonly<{ ok: true; state: T }>
  | Readonly<{ ok: false; error: GameError }>;

export interface CPUPlayer {
  chooseCard(hand: readonly Card[], state: MatchState): Card;
}
