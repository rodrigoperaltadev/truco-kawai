import { acceptCall, callPoints, makeCall, nextLevel, rejectCall } from "@/domain/game/calls";
import { emptyCallState } from "@/domain/game/match";
import type {
  CallState,
  CallType,
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

function emptyRound(): RoundState {
  return {
    roundNumber: 1,
    trick: { cardsPlayed: [], winner: null, resolved: false },
  };
}

/**
 * Builds a MatchState with known hands for deterministic call testing.
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

// ── callPoints ────────────────────────────────────────────────────────

describe("callPoints", () => {
  it("returns 1 for null (base hand)", () => {
    expect(callPoints(null)).toBe(1);
  });

  it("returns 2 for truco", () => {
    expect(callPoints("truco")).toBe(2);
  });

  it("returns 3 for retruco", () => {
    expect(callPoints("retruco")).toBe(3);
  });

  it("returns 4 for vale_cuatro", () => {
    expect(callPoints("vale_cuatro")).toBe(4);
  });
});

// ── nextLevel ─────────────────────────────────────────────────────────

describe("nextLevel", () => {
  it("returns truco for null", () => {
    expect(nextLevel(null)).toBe("truco");
  });

  it("returns retruco for truco", () => {
    expect(nextLevel("truco")).toBe("retruco");
  });

  it("returns vale_cuatro for retruco", () => {
    expect(nextLevel("retruco")).toBe("vale_cuatro");
  });

  it("returns null for vale_cuatro (max level)", () => {
    expect(nextLevel("vale_cuatro")).toBeNull();
  });
});

// ── makeCall — validations ────────────────────────────────────────────

describe("makeCall — validations", () => {
  it("rejects call when match is over", () => {
    const state = buildMatchState({ phase: "matchOver", winner: "team-A" });
    const res = makeCall(state, "A", "truco");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("MATCH_OVER");
  });

  it("rejects off-turn call", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const res = makeCall(state, "B", "truco");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("OUT_OF_TURN");
  });

  it("rejects call when another call is already pending", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: {
        ...buildMatchState().hand,
        callState: pendingCallState,
      },
    });
    const res = makeCall(state, "B", "retruco");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CALL_ALREADY_PENDING");
  });

  it("rejects call when caller already played in current trick", () => {
    const roundWithCard: RoundState = {
      roundNumber: 1,
      trick: {
        cardsPlayed: [{ playerId: "A", card: { suit: "espada", rank: 4 } }],
        winner: null,
        resolved: false,
      },
    };
    const state = buildMatchState({
      currentTurn: "A",
      hand: {
        ...buildMatchState().hand,
        rounds: [roundWithCard],
      },
    });
    const res = makeCall(state, "A", "truco");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CALL_WINDOW_CLOSED");
  });

  it("rejects level skip (retruco with no accepted truco)", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const res = makeCall(state, "A", "retruco");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("INVALID_CALL_LEVEL");
  });

  it("rejects vale_cuatro with no accepted retruco", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const res = makeCall(state, "A", "vale_cuatro");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("INVALID_CALL_LEVEL");
  });

  it("rejects unsupported call level (flor disabled by default)", () => {
    const state = buildMatchState({ currentTurn: "A" });
    // "flor" is not part of CallType; cast to exercise the runtime INVALID_CALL_LEVEL branch
    const res = makeCall(state, "A", "flor" as CallType);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("INVALID_CALL_LEVEL");
  });

  it("does not mutate input state on error", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const snapshot = JSON.parse(JSON.stringify(state));
    makeCall(state, "B", "truco");
    expect(state).toEqual(snapshot);
  });
});

// ── makeCall — success ────────────────────────────────────────────────

describe("makeCall — success", () => {
  it("mano calls truco: sets pendingCall, transfers turn, appends history", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const res = makeCall(state, "A", "truco");

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const next = res.state;
    expect(next.hand.callState.pendingCall).toEqual({
      caller: "A",
      level: "truco",
      status: "pending",
    });
    expect(next.currentTurn).toBe("B");
    expect(next.hand.callState.history).toHaveLength(1);
    expect(next.hand.callState.history[0]).toEqual({
      caller: "A",
      level: "truco",
      action: "issued",
      resolvedAt: 1,
    });
    expect(next.hand.callState.acceptedLevel).toBeNull();
  });

  it("escalation: retruco after accepted truco", () => {
    const acceptedCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "accepted" },
      acceptedLevel: "truco",
      history: [
        { caller: "A", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "truco", action: "accepted", resolvedAt: 1 },
      ],
    };
    const state = buildMatchState({
      currentTurn: "A",
      hand: {
        ...buildMatchState().hand,
        callState: acceptedCallState,
      },
    });

    const res = makeCall(state, "A", "retruco");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const next = res.state;
    expect(next.hand.callState.pendingCall).toEqual({
      caller: "A",
      level: "retruco",
      status: "pending",
    });
    expect(next.currentTurn).toBe("B");
    expect(next.hand.callState.history).toHaveLength(3);
  });
});

// ── acceptCall ────────────────────────────────────────────────────────

describe("acceptCall", () => {
  it("rejects when no pending call exists", () => {
    const state = buildMatchState({ currentTurn: "B" });
    const res = acceptCall(state, "B");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CALL_WINDOW_CLOSED");
  });

  it("rejects off-turn accept", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, callState: pendingCallState },
    });
    const res = acceptCall(state, "A");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("OUT_OF_TURN");
  });

  it("accepts call: sets status accepted, acceptedLevel, transfers turn to caller", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, callState: pendingCallState },
    });

    const res = acceptCall(state, "B");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const next = res.state;
    expect(next.hand.callState.pendingCall?.status).toBe("accepted");
    expect(next.hand.callState.acceptedLevel).toBe("truco");
    expect(next.currentTurn).toBe("A");
    expect(next.hand.callState.history).toHaveLength(2);
    expect(next.hand.callState.history[1]).toEqual({
      caller: "B",
      level: "truco",
      action: "accepted",
      resolvedAt: 1,
    });
  });
});

// ── rejectCall ────────────────────────────────────────────────────────

describe("rejectCall", () => {
  it("rejects when no pending call exists", () => {
    const state = buildMatchState({ currentTurn: "B" });
    const res = rejectCall(state, "B");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CALL_WINDOW_CLOSED");
  });

  it("rejects off-turn reject", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, callState: pendingCallState },
    });
    const res = rejectCall(state, "A");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("OUT_OF_TURN");
  });

  it("reject truco (no prior level): caller team gets 1 pt, hand ends", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, callState: pendingCallState },
    });

    const res = rejectCall(state, "B");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const next = res.state;
    // Caller (A) team gets 1 point (callPoints(null) = 1)
    expect(next.teams[0]?.score).toBe(1);
    // Hand transitions: new hand dealt (handNumber 2)
    expect(next.hand.handNumber).toBe(2);
    // History includes the rejection
    expect(next.hand.callState.history).toHaveLength(0); // new hand, clean history
  });

  it("reject retruco (accepted truco): caller team gets 2 pts", () => {
    const callState: CallState = {
      pendingCall: { caller: "A", level: "retruco", status: "pending" },
      acceptedLevel: "truco",
      history: [
        { caller: "A", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "truco", action: "accepted", resolvedAt: 1 },
        { caller: "A", level: "retruco", action: "issued", resolvedAt: 1 },
      ],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, callState },
    });

    const res = rejectCall(state, "B");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const next = res.state;
    // Caller (A) team gets 2 points (callPoints("truco") = 2)
    expect(next.teams[0]?.score).toBe(2);
  });

  it("reject vale_cuatro (accepted retruco): caller team gets 3 pts", () => {
    const callState: CallState = {
      pendingCall: { caller: "A", level: "vale_cuatro", status: "pending" },
      acceptedLevel: "retruco",
      history: [
        { caller: "A", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "truco", action: "accepted", resolvedAt: 1 },
        { caller: "A", level: "retruco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "retruco", action: "accepted", resolvedAt: 1 },
        { caller: "A", level: "vale_cuatro", action: "issued", resolvedAt: 1 },
      ],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, callState },
    });

    const res = rejectCall(state, "B");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const next = res.state;
    // Caller (A) team gets 3 points (callPoints("retruco") = 3)
    expect(next.teams[0]?.score).toBe(3);
  });
});

// ── History ───────────────────────────────────────────────────────────

describe("call history", () => {
  it("full sequence truco→accept→retruco→reject: history length 4 before hand reset", () => {
    let state = buildMatchState({ currentTurn: "A" });

    // A calls truco
    const res1 = makeCall(state, "A", "truco");
    expect(res1.ok).toBe(true);
    if (!res1.ok) return;
    state = res1.state;

    // B accepts
    const res2 = acceptCall(state, "B");
    expect(res2.ok).toBe(true);
    if (!res2.ok) return;
    state = res2.state;

    // A calls retruco
    const res3 = makeCall(state, "A", "retruco");
    expect(res3.ok).toBe(true);
    if (!res3.ok) return;
    state = res3.state;

    // Verify history has 3 entries before reject
    expect(state.hand.callState.history).toHaveLength(3);
    expect(state.hand.callState.history[0]?.action).toBe("issued");
    expect(state.hand.callState.history[1]?.action).toBe("accepted");
    expect(state.hand.callState.history[2]?.action).toBe("issued");

    // B rejects — hand ends, new hand dealt with empty history
    const res4 = rejectCall(state, "B");
    expect(res4.ok).toBe(true);
    if (!res4.ok) return;
    const finalState = res4.state;

    // New hand: history is reset
    expect(finalState.hand.callState.history).toHaveLength(0);
    expect(finalState.hand.callState.pendingCall).toBeNull();
    // But caller (A) team scored 2 pts (callPoints("truco") = 2)
    expect(finalState.teams[0]?.score).toBe(2);
  });
});

// ── Immutability ──────────────────────────────────────────────────────

describe("immutability", () => {
  it("makeCall does not mutate input state", () => {
    const state = buildMatchState({ currentTurn: "A" });
    const snapshot = JSON.parse(JSON.stringify(state));
    makeCall(state, "A", "truco");
    expect(state).toEqual(snapshot);
  });

  it("acceptCall does not mutate input state", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, callState: pendingCallState },
    });
    const snapshot = JSON.parse(JSON.stringify(state));
    acceptCall(state, "B");
    expect(state).toEqual(snapshot);
  });

  it("rejectCall does not mutate input state", () => {
    const pendingCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [],
    };
    const state = buildMatchState({
      currentTurn: "B",
      hand: { ...buildMatchState().hand, callState: pendingCallState },
    });
    const snapshot = JSON.parse(JSON.stringify(state));
    rejectCall(state, "B");
    expect(state).toEqual(snapshot);
  });
});
