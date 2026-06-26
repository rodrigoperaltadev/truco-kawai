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
}>;

export type PlayCardCmd = Readonly<{
  playerId: string;
  card: Card;
}>;

export type PlayError = "OUT_OF_TURN" | "CARD_NOT_IN_HAND" | "CARD_ALREADY_PLAYED" | "MATCH_OVER";

export type Result<T> =
  | Readonly<{ ok: true; state: T }>
  | Readonly<{ ok: false; error: PlayError }>;

export interface CPUPlayer {
  chooseCard(hand: readonly Card[], state: MatchState): Card;
}
