import { resolveHand } from "@/domain/game/hand";
import type { HandState, RoundState } from "@/domain/game/types";

function resolvedTrick(winner: string | "tie") {
  return { cardsPlayed: [], winner, resolved: true };
}

function round(roundNumber: 1 | 2 | 3, winner: string | "tie"): RoundState {
  return { roundNumber, trick: resolvedTrick(winner) };
}

function makeHand(rounds: RoundState[], mano = "A"): HandState {
  return {
    handNumber: 1,
    dealer: "B",
    mano,
    players: [
      { playerId: "A", cards: [] },
      { playerId: "B", cards: [] },
    ],
    rounds,
  };
}

describe("resolveHand", () => {
  it("2–0: player with 2 wins", () => {
    const hand = makeHand([round(1, "A"), round(2, "A")]);
    expect(resolveHand(hand)).toBe("A");
  });

  it("2–1: player with 2 wins", () => {
    const hand = makeHand([round(1, "A"), round(2, "B"), round(3, "A")]);
    expect(resolveHand(hand)).toBe("A");
  });

  it("0–2: player with 2 wins", () => {
    const hand = makeHand([round(1, "B"), round(2, "B")]);
    expect(resolveHand(hand)).toBe("B");
  });

  it("1–1 + tie → mano wins", () => {
    const hand = makeHand([round(1, "A"), round(2, "B"), round(3, "tie")]);
    expect(resolveHand(hand)).toBe("A"); // mano = "A"
  });

  it("1–1 + tie → mano wins (mano is B)", () => {
    const hand = makeHand([round(1, "A"), round(2, "B"), round(3, "tie")], "B");
    expect(resolveHand(hand)).toBe("B"); // mano = "B"
  });

  it("0–0 all ties → mano wins", () => {
    const hand = makeHand([round(1, "tie"), round(2, "tie"), round(3, "tie")]);
    expect(resolveHand(hand)).toBe("A"); // mano = "A"
  });

  it("1–0 + two ties → player with 1 win", () => {
    const hand = makeHand([round(1, "A"), round(2, "tie"), round(3, "tie")]);
    expect(resolveHand(hand)).toBe("A");
  });

  it("0–1 + two ties → player with 1 win", () => {
    const hand = makeHand([round(1, "B"), round(2, "tie"), round(3, "tie")]);
    expect(resolveHand(hand)).toBe("B");
  });

  it("ignores unresolved rounds", () => {
    const hand: HandState = {
      ...makeHand([round(1, "A"), round(2, "A")]),
      rounds: [
        round(1, "A"),
        round(2, "A"),
        { roundNumber: 3, trick: { cardsPlayed: [], winner: null, resolved: false } },
      ],
    };
    // 2 wins for A → hand already decided, unresolved round 3 ignored
    expect(resolveHand(hand)).toBe("A");
  });
});
