import { cardId, createDeck, deal, shuffle } from "@/domain/deck";

describe("createDeck", () => {
  it("returns exactly 40 cards", () => {
    expect(createDeck()).toHaveLength(40);
  });

  it("has 10 cards per suit", () => {
    const deck = createDeck();
    const bySuit = deck.reduce<Record<string, number>>((acc, card) => {
      acc[card.suit] = (acc[card.suit] ?? 0) + 1;
      return acc;
    }, {});
    expect(Object.values(bySuit)).toEqual([10, 10, 10, 10]);
  });

  it("has no duplicate cards", () => {
    const deck = createDeck();
    const ids = new Set(deck.map(cardId));
    expect(ids.size).toBe(40);
  });
});

describe("shuffle", () => {
  it("preserves all cardIds", () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, () => 0.5);
    const originalIds = new Set(deck.map(cardId));
    const shuffledIds = shuffled.map(cardId);
    expect(shuffledIds).toHaveLength(40);
    for (const id of shuffledIds) {
      expect(originalIds.has(id)).toBe(true);
    }
  });

  it("does not mutate the original array", () => {
    const deck = createDeck();
    const snapshot = deck.map(cardId);
    shuffle(deck, () => 0.3);
    expect(deck.map(cardId)).toEqual(snapshot);
  });

  it("produces a different order with a varying rng", () => {
    const deck = createDeck();
    let seed = 0;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const shuffled = shuffle(deck, rng);
    const originalIds = deck.map(cardId);
    const shuffledIds = shuffled.map(cardId);
    expect(shuffledIds).not.toEqual(originalIds);
  });
});

describe("deal", () => {
  it("deals 3 cards to 2 players with 34 remaining", () => {
    const deck = [...createDeck()];
    const { hands, remaining } = deal({ deck, handSize: 3, playerCount: 2 });
    expect(hands).toHaveLength(2);
    expect(hands[0]).toHaveLength(3);
    expect(hands[1]).toHaveLength(3);
    expect(remaining).toHaveLength(34);
  });

  it("has no overlap between hands", () => {
    const deck = [...createDeck()];
    const { hands } = deal({ deck, handSize: 3, playerCount: 2 });
    const firstHand = hands[0];
    const secondHand = hands[1];
    if (firstHand === undefined || secondHand === undefined) {
      throw new Error("Expected two hands");
    }
    const hand0Ids = new Set(firstHand.map(cardId));
    for (const card of secondHand) {
      expect(hand0Ids.has(cardId(card))).toBe(false);
    }
  });

  it("throws RangeError when deck is too small", () => {
    const smallDeck = [...createDeck()].slice(0, 2);
    expect(() => deal({ deck: smallDeck, handSize: 3, playerCount: 2 })).toThrow(RangeError);
  });

  it("defaults playerCount to 2", () => {
    const deck = [...createDeck()];
    const { hands } = deal({ deck, handSize: 3 });
    expect(hands).toHaveLength(2);
  });
});
