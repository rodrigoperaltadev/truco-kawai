import { foldHand } from "@/domain/game/fold";
import { emptyCallState, emptyEnvidoState } from "@/domain/game/match";
import type {
  CallState,
  EnvidoState,
  HandState,
  MatchState,
  Player,
  RoundState,
  Team,
} from "@/domain/game/types";

const playerA: Player = { id: "A", name: "Alice" };
const playerB: Player = { id: "B", name: "Bob" };

const teamA: Team = { id: "team-A", players: [playerA], score: 0 };
const teamB: Team = { id: "team-B", players: [playerB], score: 0 };

function emptyRound(roundNumber: 1 | 2 | 3 = 1): RoundState {
  return {
    roundNumber,
    trick: { cardsPlayed: [], winner: null, resolved: false },
  };
}

/**
 * Builds a MatchState with known hands for deterministic fold testing.
 */
function buildMatchState(overrides: Partial<MatchState> = {}): MatchState {
  const hand: HandState = {
    handNumber: 1,
    dealer: "B",
    mano: "A",
    players: [
      { playerId: "A", cards: [{ suit: "espada", rank: 4 }] },
      { playerId: "B", cards: [{ suit: "basto", rank: 2 }] },
    ],
    rounds: [emptyRound()],
    callState: emptyCallState(),
    envidoState: emptyEnvidoState(),
    ...overrides.hand,
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

// ── Guards ────────────────────────────────────────────────────────────

describe("foldHand — guards", () => {
  it("returns MATCH_OVER when phase is matchOver", () => {
    const state = buildMatchState({ phase: "matchOver", winner: "team-B" });
    const res = foldHand(state, "A");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("MATCH_OVER");
  });

  it("returns OUT_OF_TURN when folderId !== currentTurn", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const res = foldHand(state, "B");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("OUT_OF_TURN");
  });
});

// ── Branch 1: truco pending → rejectCall ──────────────────────────────

describe("foldHand — branch 1: truco pending", () => {
  it("delegates to rejectCall: no accepted level → opponent gets 1 pt", () => {
    const callState: CallState = {
      pendingCall: { caller: "B", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "B", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    // B called truco, it's A's turn to respond. A folds.
    const state = buildMatchState({
      currentTurn: "A",
      hand: { ...buildMatchState().hand, callState },
    });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Caller (B) wins callPoints(null) = 1 pt
    expect(res.state.teams[1]?.score).toBe(1);
    // New hand dealt
    expect(res.state.hand.handNumber).toBe(2);
  });

  it("delegates to rejectCall: accepted truco → opponent gets 2 pts", () => {
    const callState: CallState = {
      pendingCall: { caller: "B", level: "retruco", status: "pending" },
      acceptedLevel: "truco",
      history: [
        { caller: "B", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "A", level: "truco", action: "accepted", resolvedAt: 1 },
        { caller: "B", level: "retruco", action: "issued", resolvedAt: 1 },
      ],
    };
    const state = buildMatchState({
      currentTurn: "A",
      hand: { ...buildMatchState().hand, callState },
    });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Caller (B) wins callPoints("truco") = 2 pts
    expect(res.state.teams[1]?.score).toBe(2);
  });

  it("delegates to rejectCall: accepted retruco → opponent gets 3 pts", () => {
    const callState: CallState = {
      pendingCall: { caller: "B", level: "vale_cuatro", status: "pending" },
      acceptedLevel: "retruco",
      history: [
        { caller: "B", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "A", level: "truco", action: "accepted", resolvedAt: 1 },
        { caller: "B", level: "retruco", action: "issued", resolvedAt: 1 },
        { caller: "A", level: "retruco", action: "accepted", resolvedAt: 1 },
        { caller: "B", level: "vale_cuatro", action: "issued", resolvedAt: 1 },
      ],
    };
    const state = buildMatchState({
      currentTurn: "A",
      hand: { ...buildMatchState().hand, callState },
    });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Caller (B) wins callPoints("retruco") = 3 pts
    expect(res.state.teams[1]?.score).toBe(3);
  });
});

// ── Branch 2: envido pending (no truco) → rejectEnvido + 1pt ─────────

describe("foldHand — branch 2: envido pending (no truco)", () => {
  it("rejectEnvido then opponent gets +1 for the fold", () => {
    const envidoState: EnvidoState = {
      pendingEnvido: { caller: "B", level: "envido", status: "pending" },
      acceptedLevel: null,
      stake: 0,
      resolved: false,
      history: [{ actor: "B", level: "envido", action: "issued", round: 1 }],
    };
    // B called envido, it's A's turn to respond. A folds.
    const state = buildMatchState({
      currentTurn: "A",
      hand: { ...buildMatchState().hand, envidoState },
    });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // B gets envido rejection points (levelPoints("envido") - 1 = 1) + 1 fold pt = 2
    // rejectEnvido awards max(stake + 1, levelPoints(level) - 1) = max(0+1, 2-1) = 1
    // Then resolveMatch adds 1 more → total 2
    expect(res.state.teams[1]?.score).toBe(2);
    // New hand dealt
    expect(res.state.hand.handNumber).toBe(2);
  });

  it("fold with real_envido pending: opponent gets rejection pts + 1", () => {
    const envidoState: EnvidoState = {
      pendingEnvido: { caller: "B", level: "real_envido", status: "pending" },
      acceptedLevel: null,
      stake: 0,
      resolved: false,
      history: [{ actor: "B", level: "real_envido", action: "issued", round: 1 }],
    };
    const state = buildMatchState({
      currentTurn: "A",
      hand: { ...buildMatchState().hand, envidoState },
    });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // rejectEnvido: max(stake + 1, levelPoints("real_envido") - 1) = max(1, 2) = 2
    // resolveMatch: +1 fold pt → total 3
    expect(res.state.teams[1]?.score).toBe(3);
  });
});

// ── Branch 3: round 1, no cards, mano → opponent +2 ──────────────────

describe("foldHand — branch 3: round 1, mano folds", () => {
  it("mano folds on round 1 with no cards played → opponent gets 2 pts", () => {
    // A is mano, A's turn, round 1, no cards played
    const state = buildMatchState({ currentTurn: "A" });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Opponent (B) gets 2 points
    expect(res.state.teams[1]?.score).toBe(2);
    // New hand dealt
    expect(res.state.hand.handNumber).toBe(2);
  });

  it("pie folds on round 1 with no cards played → opponent gets 1 pt (branch 4)", () => {
    // A is mano, B is pie. B's turn, round 1, no cards played.
    const state = buildMatchState({ currentTurn: "B" });

    const res = foldHand(state, "B");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Opponent (A) gets 1 point (branch 4: not mano)
    expect(res.state.teams[0]?.score).toBe(1);
  });
});

// ── Branch 4: else → opponent +1 ──────────────────────────────────────

describe("foldHand — branch 4: else", () => {
  it("fold on round 1 after cards played → opponent gets 1 pt", () => {
    const roundWithCard: RoundState = {
      roundNumber: 1,
      trick: {
        cardsPlayed: [{ playerId: "A", card: { suit: "espada", rank: 4 } }],
        winner: null,
        resolved: false,
      },
    };
    // A played a card, now it's B's turn. B folds.
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, rounds: [roundWithCard] },
    });

    const res = foldHand(state, "B");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Opponent (A) gets 1 point (cards have been played, so branch 4)
    expect(res.state.teams[0]?.score).toBe(1);
  });

  it("fold on round 2 → opponent gets 1 pt", () => {
    const rounds: readonly RoundState[] = [
      {
        roundNumber: 1,
        trick: {
          cardsPlayed: [
            { playerId: "A", card: { suit: "espada", rank: 4 } },
            { playerId: "B", card: { suit: "basto", rank: 2 } },
          ],
          winner: "A",
          resolved: true,
        },
      },
      emptyRound(2),
    ];
    // Round 2, A's turn (A won round 1). A folds.
    const state = buildMatchState({
      currentTurn: "A",
      hand: { ...buildMatchState().hand, rounds },
    });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Opponent (B) gets 1 point (round > 1)
    expect(res.state.teams[1]?.score).toBe(1);
  });

  it("fold with accepted truco but no pending call → branch 3 or 4 (not branch 1)", () => {
    const callState: CallState = {
      pendingCall: null,
      acceptedLevel: "truco",
      history: [
        { caller: "A", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "truco", action: "accepted", resolvedAt: 1 },
      ],
    };
    // Truco was accepted but no pending call. A is mano, round 1, no cards.
    const state = buildMatchState({
      currentTurn: "A",
      hand: { ...buildMatchState().hand, callState },
    });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Branch 3: round 1, no cards, mano → opponent gets 2 (NOT callPoints("truco")=2)
    // In this case both happen to be 2, but the path is branch 3, not branch 1.
    expect(res.state.teams[1]?.score).toBe(2);
  });

  it("fold with accepted truco on round 2 → opponent gets 1 pt (branch 4)", () => {
    const callState: CallState = {
      pendingCall: null,
      acceptedLevel: "truco",
      history: [
        { caller: "A", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "truco", action: "accepted", resolvedAt: 1 },
      ],
    };
    const rounds: readonly RoundState[] = [
      {
        roundNumber: 1,
        trick: {
          cardsPlayed: [
            { playerId: "A", card: { suit: "espada", rank: 4 } },
            { playerId: "B", card: { suit: "basto", rank: 2 } },
          ],
          winner: "A",
          resolved: true,
        },
      },
      emptyRound(2),
    ];
    const state = buildMatchState({
      currentTurn: "A",
      hand: { ...buildMatchState().hand, callState, rounds },
    });

    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Branch 4: round > 1 → opponent gets 1 (NOT callPoints("truco")=2)
    expect(res.state.teams[1]?.score).toBe(1);
  });
});

// ── Match over threshold ──────────────────────────────────────────────

describe("foldHand — match over threshold", () => {
  it("fold awards points that reach pointsToWin → matchOver", () => {
    const teamANearWin: Team = { id: "team-A", players: [playerA], score: 14 };
    const state = buildMatchState({
      currentTurn: "B",
      teams: [teamANearWin, teamB],
    });

    // B folds (branch 4: pie, round 1, no cards → opponent A gets 1 pt)
    // Wait, B is pie, so this is branch 4 → A gets 1 pt → 14 + 1 = 15 → matchOver
    // Actually B is not mano (A is mano), so B is pie. Branch 4 → opponent (A) gets 1.
    const res = foldHand(state, "B");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.state.teams[0]?.score).toBe(15);
    expect(res.state.phase).toBe("matchOver");
    expect(res.state.winner).toBe("team-A");
  });

  it("mano fold on round 1 reaching pointsToWin → matchOver", () => {
    const teamBNearWin: Team = { id: "team-B", players: [playerB], score: 13 };
    const state = buildMatchState({
      currentTurn: "A",
      teams: [teamA, teamBNearWin],
    });

    // A is mano, folds on round 1 → opponent B gets 2 pts → 13 + 2 = 15 → matchOver
    const res = foldHand(state, "A");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.state.teams[1]?.score).toBe(15);
    expect(res.state.phase).toBe("matchOver");
    expect(res.state.winner).toBe("team-B");
  });
});

// ── Purity / Immutability ─────────────────────────────────────────────

describe("foldHand — purity", () => {
  it("does not mutate input state", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const snapshot = JSON.parse(JSON.stringify(state));
    foldHand(state, "A");
    expect(state).toEqual(snapshot);
  });

  it("same input produces same output", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const res1 = foldHand(state, "A");
    const res2 = foldHand(state, "A");

    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);
    if (!res1.ok || !res2.ok) return;

    // Both results should have the same scores
    expect(res1.state.teams[0]?.score).toBe(res2.state.teams[0]?.score);
    expect(res1.state.teams[1]?.score).toBe(res2.state.teams[1]?.score);
    expect(res1.state.hand.handNumber).toBe(res2.state.hand.handNumber);
  });
});
