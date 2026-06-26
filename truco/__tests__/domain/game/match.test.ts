import { cardId } from "@/domain/deck";
import { createMatch, resolveMatch } from "@/domain/game";
import type { MatchState, Player } from "@/domain/game";

const playerA: Player = { id: "player-a", name: "Alice" };
const playerB: Player = { id: "player-b", name: "Bob" };

const seededRng = () => {
  let seed = 12345;
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
};

describe("createMatch", () => {
  it("creates a valid match at 15 points", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    expect(state.phase).toBe("playing");
    expect(state.pointsToWin).toBe(15);
    expect(state.teams[0]?.score).toBe(0);
    expect(state.teams[1]?.score).toBe(0);
    expect(state.winner).toBeNull();
  });

  it("creates a valid match at 30 points", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 30,
      rng: seededRng(),
    });

    expect(state.pointsToWin).toBe(30);
  });

  it("throws RangeError on invalid pointsToWin (20)", () => {
    expect(() =>
      createMatch({
        players: [playerA, playerB],
        pointsToWin: 20 as 15 | 30,
        rng: seededRng(),
      }),
    ).toThrow(RangeError);
  });

  it("throws RangeError on invalid pointsToWin (0)", () => {
    expect(() =>
      createMatch({
        players: [playerA, playerB],
        pointsToWin: 0 as 15 | 30,
        rng: seededRng(),
      }),
    ).toThrow(RangeError);
  });

  it("throws TypeError on duplicate player IDs", () => {
    const duplicatePlayer: Player = { id: "player-a", name: "Charlie" };
    expect(() =>
      createMatch({
        players: [playerA, duplicatePlayer],
        pointsToWin: 15,
        rng: seededRng(),
      }),
    ).toThrow(TypeError);
  });

  it("assigns mano = players[0] for hand 1", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    expect(state.hand.mano).toBe(playerA.id);
    expect(state.hand.dealer).toBe(playerB.id);
  });

  it("sets currentTurn to mano at start", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    expect(state.currentTurn).toBe(state.hand.mano);
  });

  it("deals exactly 3 cards per player", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    const handA = state.hand.players[0];
    const handB = state.hand.players[1];

    expect(handA?.cards).toHaveLength(3);
    expect(handB?.cards).toHaveLength(3);
  });

  it("has no card overlap between hands", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    const handA = state.hand.players[0];
    const handB = state.hand.players[1];

    if (handA === undefined || handB === undefined) {
      throw new Error("Expected two hands");
    }

    const handAIds = new Set(handA.cards.map(cardId));
    for (const card of handB.cards) {
      expect(handAIds.has(cardId(card))).toBe(false);
    }
  });

  it("initializes round 1 with empty trick", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    const round = state.hand.rounds[0];
    expect(round?.roundNumber).toBe(1);
    expect(round?.trick.cardsPlayed).toHaveLength(0);
    expect(round?.trick.winner).toBeNull();
    expect(round?.trick.resolved).toBe(false);
  });
});

describe("resolveMatch", () => {
  it("increments winning team score by 1", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    const updated = resolveMatch(state, playerA.id);
    expect(updated.teams[0]?.score).toBe(1);
    expect(updated.teams[1]?.score).toBe(0);
  });

  it("transitions to matchOver when score reaches pointsToWin", () => {
    const state: MatchState = {
      ...createMatch({
        players: [playerA, playerB],
        pointsToWin: 15,
        rng: seededRng(),
      }),
      teams: [
        { id: "team-player-a", players: [playerA], score: 14 },
        { id: "team-player-b", players: [playerB], score: 10 },
      ],
    };

    const updated = resolveMatch(state, playerA.id);
    expect(updated.phase).toBe("matchOver");
    expect(updated.winner).toBe("team-player-a");
    expect(updated.teams[0]?.score).toBe(15);
  });

  it("continues playing when score is below pointsToWin", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    const updated = resolveMatch(state, playerA.id);
    expect(updated.phase).toBe("playing");
    expect(updated.winner).toBeNull();
    expect(updated.hand.handNumber).toBe(2);
  });

  it("alternates dealer for next hand", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    expect(state.hand.dealer).toBe(playerB.id);

    const updated = resolveMatch(state, playerA.id);
    expect(updated.hand.dealer).toBe(playerA.id);
    expect(updated.hand.mano).toBe(playerB.id);
  });

  it("throws if hand winner is not in any team", () => {
    const state = createMatch({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
    });

    expect(() => resolveMatch(state, "unknown-player")).toThrow(/not found in any team/);
  });
});
