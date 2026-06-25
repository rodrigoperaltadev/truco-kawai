import { createDeck, trucoRank } from "@/domain/deck";

describe("trucoRank", () => {
  it("assigns special ranks in order", () => {
    expect(trucoRank({ suit: "espada", rank: 4 })).toBe(1);
    expect(trucoRank({ suit: "basto", rank: 4 })).toBe(2);
    expect(trucoRank({ suit: "espada", rank: 7 })).toBe(3);
    expect(trucoRank({ suit: "oro", rank: 7 })).toBe(4);
  });

  it("specials are strictly ordered", () => {
    const esp4 = trucoRank({ suit: "espada", rank: 4 });
    const bas4 = trucoRank({ suit: "basto", rank: 4 });
    const esp7 = trucoRank({ suit: "espada", rank: 7 });
    const oro7 = trucoRank({ suit: "oro", rank: 7 });
    expect(esp4).toBeLessThan(bas4);
    expect(bas4).toBeLessThan(esp7);
    expect(esp7).toBeLessThan(oro7);
  });

  it("two 3s tie at the same rank", () => {
    expect(trucoRank({ suit: "espada", rank: 3 })).toBe(trucoRank({ suit: "oro", rank: 3 }));
    expect(trucoRank({ suit: "espada", rank: 3 })).toBe(5);
  });

  it("copa-7 and basto-7 tie", () => {
    expect(trucoRank({ suit: "copa", rank: 7 })).toBe(trucoRank({ suit: "basto", rank: 7 }));
    expect(trucoRank({ suit: "copa", rank: 7 })).toBe(10);
  });

  it("full deck: min=1, max=14, no undefined", () => {
    const deck = createDeck();
    const ranks = deck.map(trucoRank);
    expect(Math.min(...ranks)).toBe(1);
    expect(Math.max(...ranks)).toBe(14);
    for (const r of ranks) {
      expect(r).toBeDefined();
    }
  });
});
