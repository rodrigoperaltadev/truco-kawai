import { cardId, createDeck, deal, shuffle } from "@/domain/deck";
import { callPoints } from "./calls";
import { startHandRoles } from "./turn";
import type {
  CallState,
  CreateMatchOptions,
  EnvidoState,
  HandState,
  MatchState,
  Player,
  PlayerHand,
  PointsToWin,
  RoundState,
  Team,
  TrickState,
} from "./types";

const VALID_POINTS: readonly PointsToWin[] = [15, 30];
const HAND_SIZE = 3;

/**
 * Returns an empty CallState for a new hand.
 */
export function emptyCallState(): CallState {
  return { pendingCall: null, acceptedLevel: null, history: [] };
}

/**
 * Returns an empty EnvidoState for a new hand.
 */
export function emptyEnvidoState(): EnvidoState {
  return { pendingEnvido: null, acceptedLevel: null, stake: 0, resolved: false, history: [] };
}

/**
 * Creates a new match state with the given players and points-to-win.
 * Throws RangeError if pointsToWin is not 15 or 30.
 * Throws TypeError if player IDs are not unique.
 */
export function createMatch(options: CreateMatchOptions): MatchState {
  const { players, pointsToWin, rng } = options;

  if (!VALID_POINTS.includes(pointsToWin)) {
    throw new RangeError(`pointsToWin must be 15 or 30, got ${pointsToWin as number}`);
  }

  const [playerA, playerB] = players;
  if (playerA === undefined || playerB === undefined) {
    throw new TypeError("Expected exactly two players");
  }

  if (playerA.id === playerB.id) {
    throw new TypeError(`Duplicate player id: ${playerA.id}`);
  }

  const teams = createTeams(players);
  const hand = dealHand(1, players, rng);

  return {
    phase: "playing",
    pointsToWin,
    players,
    teams,
    hand,
    currentTurn: hand.mano,
    winner: null,
  };
}

/**
 * Creates two teams from two players (1v1).
 */
function createTeams(players: readonly [Player, Player]): readonly [Team, Team] {
  const [playerA, playerB] = players;
  if (playerA === undefined || playerB === undefined) {
    throw new TypeError("Expected exactly two players");
  }

  return [
    { id: `team-${playerA.id}`, players: [playerA], score: 0 },
    { id: `team-${playerB.id}`, players: [playerB], score: 0 },
  ];
}

/**
 * Deals a new hand: shuffle deck, deal 3 cards per player, create round structure.
 */
export function dealHand(
  handNumber: number,
  players: readonly [Player, Player],
  rng?: () => number,
): HandState {
  const deck = createDeck();
  const shuffled = shuffle(deck, rng);
  const { hands } = deal({ deck: shuffled, handSize: HAND_SIZE, playerCount: 2 });

  const [cardsA, cardsB] = hands;
  if (cardsA === undefined || cardsB === undefined) {
    throw new Error("Expected two hands from deal");
  }

  const [playerA, playerB] = players;
  if (playerA === undefined || playerB === undefined) {
    throw new Error("Expected two players");
  }

  const playerHands: readonly [PlayerHand, PlayerHand] = [
    { playerId: playerA.id, cards: cardsA },
    { playerId: playerB.id, cards: cardsB },
  ];

  const { dealer, mano } = startHandRoles(handNumber, players);

  const initialTrick: TrickState = {
    cardsPlayed: [],
    winner: null,
    resolved: false,
  };

  const initialRound: RoundState = {
    roundNumber: 1,
    trick: initialTrick,
  };

  return {
    handNumber,
    dealer,
    mano,
    players: playerHands,
    rounds: [initialRound],
    callState: emptyCallState(),
    envidoState: emptyEnvidoState(),
  };
}

/**
 * Resolves match scoring after a hand is won.
 * When pointsOverride is provided (rejection path), uses that value.
 * Otherwise derives points from callState.acceptedLevel (null → 1, truco → 2, etc.).
 * Returns updated MatchState with incremented score or matchOver if pointsToWin reached.
 */
export function resolveMatch(
  state: MatchState,
  handWinnerId: string,
  pointsOverride?: number,
): MatchState {
  const teamIdx = state.teams.findIndex((team) => {
    const player = team.players[0];
    return player !== undefined && player.id === handWinnerId;
  });

  if (teamIdx === -1) {
    throw new Error(`Hand winner ${handWinnerId} not found in any team`);
  }

  const winningTeam = state.teams[teamIdx];
  if (winningTeam === undefined) {
    throw new Error("Expected winning team");
  }

  const points = pointsOverride ?? callPoints(state.hand.callState.acceptedLevel);
  const newScore = winningTeam.score + points;
  const team0 = state.teams[0];
  const team1 = state.teams[1];
  if (team0 === undefined || team1 === undefined) {
    throw new Error("Expected two teams");
  }
  const updatedTeams: readonly [Team, Team] = [
    teamIdx === 0 ? { ...team0, score: newScore } : team0,
    teamIdx === 1 ? { ...team1, score: newScore } : team1,
  ];

  if (newScore >= state.pointsToWin) {
    return {
      ...state,
      teams: updatedTeams,
      phase: "matchOver",
      winner: winningTeam.id,
    };
  }

  const nextHandNumber = state.hand.handNumber + 1;
  const nextHand = dealHand(nextHandNumber, state.players);

  return {
    ...state,
    teams: updatedTeams,
    hand: nextHand,
    currentTurn: nextHand.mano,
  };
}

/**
 * Calculates falta envido points for a given team.
 * Returns max(1, pointsToWin - teamScore).
 */
export function faltaPoints(state: MatchState, winnerTeamIdx: number): number {
  const team = state.teams[winnerTeamIdx];
  if (team === undefined) {
    throw new Error(`Team index ${winnerTeamIdx} out of range`);
  }
  return Math.max(1, state.pointsToWin - team.score);
}

/**
 * Scores envido points mid-hand. Adds points to the winner's team score.
 * Sets matchOver if score >= pointsToWin. Does NOT deal a new hand.
 * If nextTurn is provided, uses it; otherwise defaults to the opponent of the winner.
 */
export function scoreEnvido(
  state: MatchState,
  winnerId: string,
  points: number,
  nextTurn?: string,
): MatchState {
  const teamIdx = state.teams.findIndex((team) => {
    const player = team.players[0];
    return player !== undefined && player.id === winnerId;
  });

  if (teamIdx === -1) {
    throw new Error(`Envido winner ${winnerId} not found in any team`);
  }

  const winningTeam = state.teams[teamIdx];
  if (winningTeam === undefined) {
    throw new Error("Expected winning team");
  }

  const newScore = winningTeam.score + points;
  const team0 = state.teams[0];
  const team1 = state.teams[1];
  if (team0 === undefined || team1 === undefined) {
    throw new Error("Expected two teams");
  }
  const updatedTeams: readonly [Team, Team] = [
    teamIdx === 0 ? { ...team0, score: newScore } : team0,
    teamIdx === 1 ? { ...team1, score: newScore } : team1,
  ];

  if (newScore >= state.pointsToWin) {
    return {
      ...state,
      teams: updatedTeams,
      phase: "matchOver",
      winner: winningTeam.id,
    };
  }

  // Do NOT deal a new hand — envido resolves mid-hand.
  // Set currentTurn to nextTurn if provided, otherwise opponent of the winner.
  const opponent = state.hand.players.find((p) => p.playerId !== winnerId);
  const defaultNextTurn = opponent !== undefined ? opponent.playerId : state.currentTurn;

  return {
    ...state,
    teams: updatedTeams,
    currentTurn: nextTurn ?? defaultNextTurn,
  };
}

/**
 * Utility: checks if a card has already been played in the current hand.
 */
export function isCardAlreadyPlayed(hand: HandState, cardSuit: string, cardRank: number): boolean {
  for (const round of hand.rounds) {
    for (const played of round.trick.cardsPlayed) {
      if (played.card.suit === cardSuit && played.card.rank === cardRank) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Utility: gets all card IDs played in the current hand.
 */
export function getPlayedCardIds(hand: HandState): Set<string> {
  const played = new Set<string>();
  for (const round of hand.rounds) {
    for (const pc of round.trick.cardsPlayed) {
      played.add(cardId(pc.card));
    }
  }
  return played;
}
