import { cardId } from "@/domain/deck";
import { acceptCall, makeCall } from "@/domain/game/calls";
import { emptyCallState } from "@/domain/game/match";
import { playCard } from "@/domain/game/play";
import type {
  CallState,
  HandState,
  MatchState,
  PlayCardCmd,
  Player,
  RoundState,
  Team,
} from "@/domain/game/types";

const playerA: Player = { id: "A", name: "Alice" };
const playerB: Player = { id: "B", name: "Bob" };

const teamA: Team = { id: "team-A", players: [playerA], score: 0 };
const teamB: Team = { id: "team-B", players: [playerB], score: 0 };

function emptyTrick(): RoundState {
  return {
    roundNumber: 1,
    trick: { cardsPlayed: [], winner: null, resolved: false },
  };
}

/**
 * Builds a MatchState with known hands for deterministic testing.
 */
function buildState(overrides: Partial<MatchState> = {}): MatchState {
  const hand: HandState = {
    handNumber: 1,
    dealer: "B",
    mano: "A",
    players: [
      { playerId: "A", cards: [{ suit: "espada", rank: 4 }] },
      { playerId: "B", cards: [{ suit: "basto", rank: 2 }] },
    ],
    rounds: [emptyTrick()],
    callState: emptyCallState(),
  };

  return {
    phase: "playing",
    pointsToWin: 15,
    players: [playerA, playerB],
    teams: [teamA, teamB],
    hand,
    currentTurn: "A",
    winner: null,
    ...overrides,
  };
}

/**
 * Builds a state with 3 cards per player for multi-round tests.
 */
function buildFullHandState(): MatchState {
  return buildState({
    hand: {
      handNumber: 1,
      dealer: "B",
      mano: "A",
      players: [
        {
          playerId: "A",
          cards: [
            { suit: "espada", rank: 4 },
            { suit: "basto", rank: 4 },
            { suit: "oro", rank: 1 },
          ],
        },
        {
          playerId: "B",
          cards: [
            { suit: "copa", rank: 1 },
            { suit: "oro", rank: 2 },
            { suit: "basto", rank: 2 },
          ],
        },
      ],
      rounds: [emptyTrick()],
      callState: emptyCallState(),
    },
  });
}

describe("playCard — validations", () => {
  it("rejects play after matchOver", () => {
    const state = buildState({ phase: "matchOver", winner: "team-A" });
    const cmd: PlayCardCmd = { playerId: "A", card: { suit: "espada", rank: 4 } };
    const res = playCard(state, cmd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("MATCH_OVER");
  });

  it("rejects out-of-turn play", () => {
    const state = buildState({ currentTurn: "A" });
    const cmd: PlayCardCmd = { playerId: "B", card: { suit: "basto", rank: 2 } };
    const res = playCard(state, cmd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("OUT_OF_TURN");
  });

  it("rejects card not in hand", () => {
    const state = buildState({ currentTurn: "A" });
    const cmd: PlayCardCmd = { playerId: "A", card: { suit: "copa", rank: 5 } };
    const res = playCard(state, cmd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CARD_NOT_IN_HAND");
  });

  it("rejects already-played card", () => {
    const state = buildState({
      currentTurn: "B",
      hand: {
        handNumber: 1,
        dealer: "B",
        mano: "A",
        players: [
          { playerId: "A", cards: [] },
          { playerId: "B", cards: [{ suit: "basto", rank: 2 }] },
        ],
        rounds: [
          {
            roundNumber: 1,
            trick: {
              cardsPlayed: [{ playerId: "A", card: { suit: "espada", rank: 4 } }],
              winner: null,
              resolved: false,
            },
          },
        ],
        callState: emptyCallState(),
      },
    });
    // Try to play espada-4 again (already in trick)
    const cmd: PlayCardCmd = { playerId: "B", card: { suit: "espada", rank: 4 } };
    const res = playCard(state, cmd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CARD_NOT_IN_HAND");
  });

  it("does not mutate input state on error", () => {
    const state = buildState({ currentTurn: "A" });
    const snapshot = JSON.parse(JSON.stringify(state));
    const cmd: PlayCardCmd = { playerId: "B", card: { suit: "basto", rank: 2 } };
    playCard(state, cmd);
    expect(state).toEqual(snapshot);
  });

  it("rejects play when a call is pending (CALL_PENDING)", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const state = buildState({
      currentTurn: "B",
      hand: { ...buildState().hand, callState: pendingCallState },
    });
    const cmd: PlayCardCmd = { playerId: "B", card: { suit: "basto", rank: 2 } };
    const res = playCard(state, cmd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CALL_PENDING");
  });

  it("CALL_PENDING takes priority over OUT_OF_TURN", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [],
    };
    const state = buildState({
      currentTurn: "A", // wrong turn for B, but CALL_PENDING fires first
      hand: { ...buildState().hand, callState: pendingCallState },
    });
    const cmd: PlayCardCmd = { playerId: "B", card: { suit: "basto", rank: 2 } };
    const res = playCard(state, cmd);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CALL_PENDING");
  });
});

describe("playCard — valid plays", () => {
  it("first card: removes from hand, appends to trick, advances turn", () => {
    const state = buildFullHandState();
    const p0 = state.hand.players[0];
    if (p0 === undefined) throw new Error("Expected player 0");
    const card = p0.cards[0];
    if (card === undefined) throw new Error("Expected first card");
    const cmd: PlayCardCmd = { playerId: "A", card };

    const res = playCard(state, cmd);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const next = res.state;
    // Card removed from A's hand
    const aHand = next.hand.players[0];
    if (aHand === undefined) throw new Error("Expected A hand");
    expect(aHand.cards.map(cardId)).not.toContain(cardId(card));
    expect(aHand.cards).toHaveLength(2);

    // Card appended to trick
    const round0 = next.hand.rounds[0];
    if (round0 === undefined) throw new Error("Expected round 0");
    const trick = round0.trick;
    expect(trick.cardsPlayed).toHaveLength(1);
    const played = trick.cardsPlayed[0];
    if (played === undefined) throw new Error("Expected played card");
    expect(played.playerId).toBe("A");
    expect(cardId(played.card)).toBe(cardId(card));

    // Turn passes to B
    expect(next.currentTurn).toBe("B");
    expect(trick.resolved).toBe(false);
  });

  it("second card: resolves trick, starts next round", () => {
    // A plays espada-4 (rank 1), B plays basto-2 (rank 6) → A wins
    const state = buildFullHandState();
    const cardA = { suit: "espada" as const, rank: 4 as const };
    const cardB = { suit: "basto" as const, rank: 2 as const };

    const res1 = playCard(state, { playerId: "A", card: cardA });
    expect(res1.ok).toBe(true);
    if (!res1.ok) return;

    const res2 = playCard(res1.state, { playerId: "B", card: cardB });
    expect(res2.ok).toBe(true);
    if (!res2.ok) return;

    const next = res2.state;
    const round1 = next.hand.rounds[0];
    if (round1 === undefined) throw new Error("Expected round 1");

    // Trick resolved
    expect(round1.trick.resolved).toBe(true);
    expect(round1.trick.winner).toBe("A");

    // Round 2 started
    expect(next.hand.rounds.length).toBe(2);
    const round2 = next.hand.rounds[1];
    if (round2 === undefined) throw new Error("Expected round 2");
    expect(round2.roundNumber).toBe(2);
    expect(round2.trick.cardsPlayed).toHaveLength(0);

    // A leads round 2 (trick winner)
    expect(next.currentTurn).toBe("A");
  });

  it("tie trick → mano leads next round", () => {
    // copa-7 and basto-7 both have trucoRank 10 → tie
    const state = buildState({
      hand: {
        handNumber: 1,
        dealer: "B",
        mano: "A",
        players: [
          { playerId: "A", cards: [{ suit: "copa", rank: 7 }] },
          { playerId: "B", cards: [{ suit: "basto", rank: 7 }] },
        ],
        rounds: [emptyTrick()],
        callState: emptyCallState(),
      },
    });

    const res1 = playCard(state, { playerId: "A", card: { suit: "copa", rank: 7 } });
    expect(res1.ok).toBe(true);
    if (!res1.ok) return;

    const res2 = playCard(res1.state, { playerId: "B", card: { suit: "basto", rank: 7 } });
    expect(res2.ok).toBe(true);
    if (!res2.ok) return;

    const next = res2.state;
    const round0 = next.hand.rounds[0];
    if (round0 === undefined) throw new Error("Expected round 0");
    expect(round0.trick.winner).toBe("tie");
    // Mano leads after tie
    expect(next.currentTurn).toBe("A");
  });

  it("hand ends after 2 decisive tricks (2–0)", () => {
    // A has espada-4 (rank 1) and basto-4 (rank 2) — both beat anything B has
    // B has copa-1 (rank 14) and oro-1 (rank 14)
    const state: MatchState = {
      phase: "playing",
      pointsToWin: 15,
      players: [playerA, playerB],
      teams: [teamA, teamB],
      hand: {
        handNumber: 1,
        dealer: "B",
        mano: "A",
        players: [
          {
            playerId: "A",
            cards: [
              { suit: "espada", rank: 4 },
              { suit: "basto", rank: 4 },
            ],
          },
          {
            playerId: "B",
            cards: [
              { suit: "copa", rank: 1 },
              { suit: "oro", rank: 1 },
            ],
          },
        ],
        rounds: [emptyTrick()],
        callState: emptyCallState(),
      },
      currentTurn: "A",
      winner: null,
    };

    // Round 1: A plays espada-4, B plays copa-1 → A wins
    let res = playCard(state, { playerId: "A", card: { suit: "espada", rank: 4 } });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    res = playCard(res.state, { playerId: "B", card: { suit: "copa", rank: 1 } });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Round 2: A leads, plays basto-4, B plays oro-1 → A wins
    res = playCard(res.state, { playerId: "A", card: { suit: "basto", rank: 4 } });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    res = playCard(res.state, { playerId: "B", card: { suit: "oro", rank: 1 } });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Hand over — A wins 2-0, score increments
    const finalState = res.state;
    const t0 = finalState.teams[0];
    const t1 = finalState.teams[1];
    if (t0 === undefined || t1 === undefined) throw new Error("Expected two teams");
    expect(t0.score).toBe(1);
    expect(t1.score).toBe(0);
    // New hand dealt (handNumber 2)
    expect(finalState.hand.handNumber).toBe(2);
  });

  it("turn advances correctly within a round", () => {
    const state = buildFullHandState();
    expect(state.currentTurn).toBe("A");

    const p0 = state.hand.players[0];
    if (p0 === undefined) throw new Error("Expected player 0");
    const cardA = p0.cards[0];
    if (cardA === undefined) throw new Error("Expected first card");
    const res = playCard(state, { playerId: "A", card: cardA });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.state.currentTurn).toBe("B");
  });
});

// ── playCard — call interaction ───────────────────────────────────────

describe("playCard — call interaction", () => {
  it("blocks play while call is pending, resumes after accept", () => {
    let state = buildFullHandState();

    // A calls truco
    const callRes = makeCall(state, "A", "truco");
    expect(callRes.ok).toBe(true);
    if (!callRes.ok) return;
    state = callRes.state;

    // B tries to play — should be blocked
    const pB = state.hand.players.find((p) => p.playerId === "B");
    if (pB === undefined) throw new Error("Expected B");
    const cardB = pB.cards[0];
    if (cardB === undefined) throw new Error("Expected card");
    const blocked = playCard(state, { playerId: "B", card: cardB });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toBe("CALL_PENDING");

    // B accepts
    const acceptRes = acceptCall(state, "B");
    expect(acceptRes.ok).toBe(true);
    if (!acceptRes.ok) return;
    state = acceptRes.state;

    // Now A (caller) can play
    const pA = state.hand.players.find((p) => p.playerId === "A");
    if (pA === undefined) throw new Error("Expected A");
    const cardA = pA.cards[0];
    if (cardA === undefined) throw new Error("Expected card");
    const resumed = playCard(state, { playerId: "A", card: cardA });
    expect(resumed.ok).toBe(true);
  });

  it("call timing: mano can call before playing in round 1", () => {
    const state = buildFullHandState();
    // Round 1, no cards played yet — mano (A) calls truco
    expect(state.hand.rounds[0]?.trick.cardsPlayed).toHaveLength(0);
    const res = makeCall(state, "A", "truco");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Turn transfers to B (opponent responds)
    expect(res.state.currentTurn).toBe("B");
    // A's cards are untouched
    const pA = res.state.hand.players.find((p) => p.playerId === "A");
    expect(pA?.cards).toHaveLength(3);
  });

  it("call timing: opponent can call after mano plays (same round)", () => {
    let state = buildFullHandState();
    // A plays first card
    const pA = state.hand.players[0];
    if (pA === undefined) throw new Error("Expected A");
    const cardA = pA.cards[0];
    if (cardA === undefined) throw new Error("Expected card");
    const playRes = playCard(state, { playerId: "A", card: cardA });
    expect(playRes.ok).toBe(true);
    if (!playRes.ok) return;
    state = playRes.state;

    // Now it's B's turn, B hasn't played yet — B calls truco
    expect(state.hand.rounds[0]?.trick.cardsPlayed).toHaveLength(1);
    const callRes = makeCall(state, "B", "truco");
    expect(callRes.ok).toBe(true);
    if (!callRes.ok) return;
    // Turn transfers back to A (opponent responds)
    expect(callRes.state.currentTurn).toBe("A");
  });
});
