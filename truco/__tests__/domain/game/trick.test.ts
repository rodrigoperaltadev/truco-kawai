import { resolveTrick } from "@/domain/game/trick";
import type { TrickState } from "@/domain/game/types";

describe("resolveTrick", () => {
  it("lower trucoRank wins — espada-4 (rank 1) beats basto-2 (rank 6)", () => {
    const trick: TrickState = {
      cardsPlayed: [
        { playerId: "A", card: { suit: "espada", rank: 4 } },
        { playerId: "B", card: { suit: "basto", rank: 2 } },
      ],
      winner: null,
      resolved: false,
    };
    expect(resolveTrick(trick)).toBe("A");
  });

  it("second player wins with lower trucoRank", () => {
    const trick: TrickState = {
      cardsPlayed: [
        { playerId: "A", card: { suit: "basto", rank: 2 } },
        { playerId: "B", card: { suit: "espada", rank: 4 } },
      ],
      winner: null,
      resolved: false,
    };
    expect(resolveTrick(trick)).toBe("B");
  });

  it("equal trucoRank → tie (copa-7 vs basto-7, both rank 10)", () => {
    const trick: TrickState = {
      cardsPlayed: [
        { playerId: "A", card: { suit: "copa", rank: 7 } },
        { playerId: "B", card: { suit: "basto", rank: 7 } },
      ],
      winner: null,
      resolved: false,
    };
    expect(resolveTrick(trick)).toBe("tie");
  });

  it("equal trucoRank → tie (oro-5 vs copa-5, both rank 12)", () => {
    const trick: TrickState = {
      cardsPlayed: [
        { playerId: "A", card: { suit: "oro", rank: 5 } },
        { playerId: "B", card: { suit: "copa", rank: 5 } },
      ],
      winner: null,
      resolved: false,
    };
    expect(resolveTrick(trick)).toBe("tie");
  });

  it("espada-4 (rank 1) beats basto-4 (rank 2)", () => {
    const trick: TrickState = {
      cardsPlayed: [
        { playerId: "A", card: { suit: "espada", rank: 4 } },
        { playerId: "B", card: { suit: "basto", rank: 4 } },
      ],
      winner: null,
      resolved: false,
    };
    expect(resolveTrick(trick)).toBe("A");
  });

  it("throws on incomplete trick (0 cards)", () => {
    const trick: TrickState = {
      cardsPlayed: [],
      winner: null,
      resolved: false,
    };
    expect(() => resolveTrick(trick)).toThrow("exactly 2 cards");
  });

  it("throws on incomplete trick (1 card)", () => {
    const trick: TrickState = {
      cardsPlayed: [{ playerId: "A", card: { suit: "espada", rank: 4 } }],
      winner: null,
      resolved: false,
    };
    expect(() => resolveTrick(trick)).toThrow("exactly 2 cards");
  });
});
