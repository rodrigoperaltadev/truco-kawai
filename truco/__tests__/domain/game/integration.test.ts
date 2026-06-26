import { cardId } from "@/domain/deck";
import { createMatch } from "@/domain/game/match";
import { playCard } from "@/domain/game/play";
import type { Card, MatchState, PlayCardCmd, Player } from "@/domain/game/types";

const playerA: Player = { id: "A", name: "Alice" };
const playerB: Player = { id: "B", name: "Bob" };

/**
 * Deterministic PRNG — mulberry32.
 * Given the same seed, always produces the same sequence.
 */
function createSeededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simple strategy: always play the first card in hand.
 * Deterministic given the same hand state.
 */
function pickFirstCard(hand: readonly Card[]): Card {
  const card = hand[0];
  if (card === undefined) throw new Error("No cards in hand");
  return card;
}

/**
 * Plays a full match to completion using a simple "first card" strategy.
 * Returns the sequence of states for inspection.
 */
function playFullMatch(seed: number): MatchState[] {
  const rng = createSeededRng(seed);
  let state = createMatch({
    players: [playerA, playerB],
    pointsToWin: 15,
    rng,
  });

  const states: MatchState[] = [state];
  let safety = 0;
  const MAX_PLAYS = 1000;

  while (state.phase !== "matchOver" && safety < MAX_PLAYS) {
    safety++;
    const currentRound = state.hand.rounds[state.hand.rounds.length - 1];
    if (currentRound === undefined) throw new Error("No current round");

    const currentPlayerId = state.currentTurn;
    const playerHand = state.hand.players.find((p) => p.playerId === currentPlayerId);
    if (playerHand === undefined) throw new Error(`Player ${currentPlayerId} not found`);

    const card = pickFirstCard(playerHand.cards);
    const cmd: PlayCardCmd = { playerId: currentPlayerId, card };
    const result = playCard(state, cmd);

    if (!result.ok) {
      throw new Error(`playCard failed with error: ${result.error}`);
    }

    state = result.state;
    states.push(state);
  }

  if (safety >= MAX_PLAYS) {
    throw new Error("Match did not complete within safety limit");
  }

  return states;
}

describe("Integration — full 15-point match", () => {
  const states = playFullMatch(42);
  const finalState = states[states.length - 1];

  it("completes the match (phase = matchOver)", () => {
    expect(finalState?.phase).toBe("matchOver");
  });

  it("sets a winner team id", () => {
    expect(finalState?.winner).not.toBeNull();
    expect(typeof finalState?.winner).toBe("string");
    if (finalState === undefined) return;
    const teamIds = finalState.teams.map((t) => t.id);
    expect(teamIds).toContain(finalState.winner);
  });

  it("winning team score equals pointsToWin (15)", () => {
    if (finalState === undefined) return;
    const winnerTeam = finalState.teams.find((t) => t.id === finalState.winner);
    expect(winnerTeam).toBeDefined();
    expect(winnerTeam?.score).toBe(15);
  });

  it("losing team score is less than pointsToWin", () => {
    if (finalState === undefined) return;
    const loserTeam = finalState.teams.find((t) => t.id !== finalState.winner);
    expect(loserTeam).toBeDefined();
    expect(loserTeam?.score).toBeLessThan(15);
  });

  it("total points distributed equals sum of both team scores", () => {
    if (finalState === undefined) return;
    const team0 = finalState.teams[0];
    const team1 = finalState.teams[1];
    if (team0 === undefined || team1 === undefined) return;
    const totalPoints = team0.score + team1.score;
    expect(totalPoints).toBeGreaterThan(0);
    expect(totalPoints).toBeLessThanOrEqual(30);
  });

  it("no play is accepted after matchOver", () => {
    if (finalState === undefined) return;
    const loserTeam = finalState.teams.find((t) => t.id !== finalState.winner);
    const loserPlayer = loserTeam?.players[0];
    if (loserPlayer === undefined) return;

    const cmd: PlayCardCmd = {
      playerId: loserPlayer.id,
      card: { suit: "espada", rank: 1 },
    };
    const result = playCard(finalState, cmd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("MATCH_OVER");
    }
  });

  it("mano leads round 1 of hand 1", () => {
    const firstState = states[0];
    if (firstState === undefined) return;
    expect(firstState.hand.handNumber).toBe(1);
    expect(firstState.hand.mano).toBe(playerA.id);
    expect(firstState.currentTurn).toBe(playerA.id);
  });
});

describe("Integration — turn order invariants across hands", () => {
  it("mano leads round 1 of every hand", () => {
    const matchStates = playFullMatch(99);

    let lastHandNumber = -1;
    for (const state of matchStates) {
      if (state.hand.handNumber !== lastHandNumber) {
        expect(state.currentTurn).toBe(state.hand.mano);
        lastHandNumber = state.hand.handNumber;
      }
    }
  });

  it("trick winner leads the next round", () => {
    const matchStates = playFullMatch(77);

    for (let i = 0; i < matchStates.length - 1; i++) {
      const current = matchStates[i];
      const next = matchStates[i + 1];
      if (current === undefined || next === undefined) continue;

      const currentRound = current.hand.rounds[current.hand.rounds.length - 1];
      if (currentRound === undefined) continue;

      if (currentRound.trick.resolved && next.hand.rounds.length > current.hand.rounds.length) {
        const trickWinner = currentRound.trick.winner;
        if (trickWinner === "tie") {
          expect(next.currentTurn).toBe(next.hand.mano);
        } else {
          expect(next.currentTurn).toBe(trickWinner);
        }
      }
    }
  });

  it("hand winner resolves correctly (best-of-3)", () => {
    const matchStates = playFullMatch(55);

    for (let i = 0; i < matchStates.length - 1; i++) {
      const current = matchStates[i];
      const next = matchStates[i + 1];
      if (current === undefined || next === undefined) continue;

      if (next.hand.handNumber > current.hand.handNumber) {
        const curT0 = current.teams[0];
        const curT1 = current.teams[1];
        const nxtT0 = next.teams[0];
        const nxtT1 = next.teams[1];
        if (curT0 === undefined || curT1 === undefined) continue;
        if (nxtT0 === undefined || nxtT1 === undefined) continue;

        const scoreDiff = nxtT0.score + nxtT1.score - (curT0.score + curT1.score);
        expect(scoreDiff).toBe(1);
      }
    }
  });
});

describe("Integration — deterministic replay", () => {
  it("same seed produces identical first hand", () => {
    const rng1 = createSeededRng(42);
    const state1 = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: rng1,
    });

    const rng2 = createSeededRng(42);
    const state2 = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: rng2,
    });

    expect(state1.hand.handNumber).toBe(state2.hand.handNumber);
    expect(state1.currentTurn).toBe(state2.currentTurn);
    expect(state1.hand.mano).toBe(state2.hand.mano);
    expect(state1.hand.dealer).toBe(state2.hand.dealer);

    const h1A = state1.hand.players[0];
    const h2A = state2.hand.players[0];
    const h1B = state1.hand.players[1];
    const h2B = state2.hand.players[1];
    if (h1A === undefined || h2A === undefined) return;
    if (h1B === undefined || h2B === undefined) return;
    expect(h1A.cards.map(cardId)).toEqual(h2A.cards.map(cardId));
    expect(h1B.cards.map(cardId)).toEqual(h2B.cards.map(cardId));
  });

  it("different seeds produce different deals", () => {
    const rng1 = createSeededRng(1);
    const state1 = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: rng1,
    });

    const rng2 = createSeededRng(999);
    const state2 = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: rng2,
    });

    const hand1A = state1.hand.players[0];
    const hand2A = state2.hand.players[0];
    if (hand1A === undefined || hand2A === undefined) return;

    const ids1 = hand1A.cards.map(cardId).sort();
    const ids2 = hand2A.cards.map(cardId).sort();
    expect(ids1).not.toEqual(ids2);
  });
});

describe("Integration — state immutability", () => {
  it("playCard never mutates the input state", () => {
    const rng = createSeededRng(123);
    let state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng,
    });

    for (let i = 0; i < 4; i++) {
      const snapshot = JSON.stringify(state);

      const playerHand = state.hand.players.find((p) => p.playerId === state.currentTurn);
      if (playerHand === undefined || playerHand.cards.length === 0) break;

      const card = playerHand.cards[0];
      if (card === undefined) break;

      const result = playCard(state, { playerId: state.currentTurn, card });

      expect(JSON.stringify(state)).toBe(snapshot);

      if (result.ok) {
        state = result.state;
      } else {
        break;
      }
    }
  });
});
