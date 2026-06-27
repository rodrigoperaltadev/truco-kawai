import {
  acceptEnvido,
  calcEnvidoPoints,
  callEnvido,
  envidoCardValue,
  isEnvidoWindowOpen,
  isValidEnvidoLevel,
  levelPoints,
  rejectEnvido,
} from "@/domain/game/envido";
import { emptyCallState, emptyEnvidoState, faltaPoints, scoreEnvido } from "@/domain/game/match";
import type { Card, HandState, MatchState, Player, RoundState, Team } from "@/domain/game/types";

const playerA: Player = { id: "A", name: "Alice" };
const playerB: Player = { id: "B", name: "Bob" };

const teamA: Team = { id: "team-A", players: [playerA], score: 0 };
const teamB: Team = { id: "team-B", players: [playerB], score: 0 };

function emptyRound(): RoundState {
  return { roundNumber: 1, trick: { cardsPlayed: [], winner: null, resolved: false } };
}

function buildMatch(overrides: Partial<MatchState> = {}): MatchState {
  const hand: HandState = {
    handNumber: 1,
    dealer: "B",
    mano: "A",
    players: [
      { playerId: "A", cards: [{ suit: "oro", rank: 1 }] },
      { playerId: "B", cards: [{ suit: "basto", rank: 2 }] },
    ],
    rounds: [emptyRound()],
    callState: emptyCallState(),
    envidoState: emptyEnvidoState(),
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

function buildWithCards(
  cardsA: readonly Card[],
  cardsB: readonly Card[],
  scoreA = 0,
  scoreB = 0,
): MatchState {
  return buildMatch({
    teams: [
      { id: "team-A", players: [playerA], score: scoreA },
      { id: "team-B", players: [playerB], score: scoreB },
    ],
    hand: {
      handNumber: 1,
      dealer: "B",
      mano: "A",
      players: [
        { playerId: "A", cards: cardsA },
        { playerId: "B", cards: cardsB },
      ],
      rounds: [emptyRound()],
      callState: emptyCallState(),
      envidoState: emptyEnvidoState(),
    },
  });
}

// ── envidoCardValue ──────────────────────────────────────────────────

describe("envidoCardValue", () => {
  it("returns rank for 1-3", () => {
    expect(envidoCardValue(1)).toBe(1);
    expect(envidoCardValue(2)).toBe(2);
    expect(envidoCardValue(3)).toBe(3);
  });

  it("returns 0 for 4 and 5", () => {
    expect(envidoCardValue(4)).toBe(0);
    expect(envidoCardValue(5)).toBe(0);
  });

  it("returns rank for 6 and 7", () => {
    expect(envidoCardValue(6)).toBe(6);
    expect(envidoCardValue(7)).toBe(7);
  });

  it("returns 0 for face cards (10, 11, 12)", () => {
    expect(envidoCardValue(10)).toBe(0);
    expect(envidoCardValue(11)).toBe(0);
    expect(envidoCardValue(12)).toBe(0);
  });
});

// ── calcEnvidoPoints ─────────────────────────────────────────────────

describe("calcEnvidoPoints", () => {
  it("two same-suit: oro-1 + oro-7 + basto-3 → 28", () => {
    expect(
      calcEnvidoPoints([
        { suit: "oro", rank: 1 },
        { suit: "oro", rank: 7 },
        { suit: "basto", rank: 3 },
      ]),
    ).toBe(28);
  });

  it("face cards worth 0: espada-12 + espada-10 + copa-3 → 20", () => {
    expect(
      calcEnvidoPoints([
        { suit: "espada", rank: 12 },
        { suit: "espada", rank: 10 },
        { suit: "copa", rank: 3 },
      ]),
    ).toBe(20);
  });

  it("rank 4 and 5 worth 0: oro-4 + oro-5 + basto-1 → 20", () => {
    expect(
      calcEnvidoPoints([
        { suit: "oro", rank: 4 },
        { suit: "oro", rank: 5 },
        { suit: "basto", rank: 1 },
      ]),
    ).toBe(20);
  });

  it("no same-suit: espada-7 + copa-3 + basto-1 → 7", () => {
    expect(
      calcEnvidoPoints([
        { suit: "espada", rank: 7 },
        { suit: "copa", rank: 3 },
        { suit: "basto", rank: 1 },
      ]),
    ).toBe(7);
  });

  it("all different suits with face: espada-12 + copa-7 + basto-3 → 7", () => {
    // espada-12=0, copa-7=7, basto-3=3 → highest single = 7
    expect(
      calcEnvidoPoints([
        { suit: "espada", rank: 12 },
        { suit: "copa", rank: 7 },
        { suit: "basto", rank: 3 },
      ]),
    ).toBe(7);
  });

  it("is deterministic", () => {
    const cards: Card[] = [
      { suit: "oro", rank: 7 },
      { suit: "oro", rank: 6 },
      { suit: "basto", rank: 1 },
    ];
    expect(calcEnvidoPoints(cards)).toBe(calcEnvidoPoints(cards));
  });

  it("three same-suit cards, flor disabled — take two highest: espada-7 + espada-6 + espada-1 → 33", () => {
    expect(
      calcEnvidoPoints([
        { suit: "espada", rank: 7 },
        { suit: "espada", rank: 6 },
        { suit: "espada", rank: 1 },
      ]),
    ).toBe(33); // 7 + 6 + 20; rank-1 card is ignored
  });
});

// ── levelPoints ──────────────────────────────────────────────────────

describe("levelPoints", () => {
  it("envido → 2", () => {
    expect(levelPoints("envido")).toBe(2);
  });

  it("real_envido → 3", () => {
    expect(levelPoints("real_envido")).toBe(3);
  });

  it("falta_envido → 0", () => {
    expect(levelPoints("falta_envido")).toBe(0);
  });
});

// ── isValidEnvidoLevel ───────────────────────────────────────────────

describe("isValidEnvidoLevel", () => {
  it("null → any level is valid", () => {
    expect(isValidEnvidoLevel(null, "envido")).toBe(true);
    expect(isValidEnvidoLevel(null, "real_envido")).toBe(true);
    expect(isValidEnvidoLevel(null, "falta_envido")).toBe(true);
  });

  it("envido → envido (recanto), real_envido, or falta_envido", () => {
    expect(isValidEnvidoLevel("envido", "envido")).toBe(true);
    expect(isValidEnvidoLevel("envido", "real_envido")).toBe(true);
    expect(isValidEnvidoLevel("envido", "falta_envido")).toBe(true);
  });

  it("real_envido → real_envido (recanto) or falta_envido", () => {
    expect(isValidEnvidoLevel("real_envido", "real_envido")).toBe(true);
    expect(isValidEnvidoLevel("real_envido", "falta_envido")).toBe(true);
    expect(isValidEnvidoLevel("real_envido", "envido")).toBe(false);
  });

  it("falta_envido → nothing", () => {
    expect(isValidEnvidoLevel("falta_envido", "envido")).toBe(false);
    expect(isValidEnvidoLevel("falta_envido", "real_envido")).toBe(false);
    expect(isValidEnvidoLevel("falta_envido", "falta_envido")).toBe(false);
  });
});

// ── isEnvidoWindowOpen ───────────────────────────────────────────────

describe("isEnvidoWindowOpen", () => {
  it("open in round 1 with no cards played", () => {
    expect(isEnvidoWindowOpen(buildMatch(), "A")).toBe(true);
  });

  it("closed when envido already resolved", () => {
    const state = buildMatch({
      hand: { ...buildMatch().hand, envidoState: { ...emptyEnvidoState(), resolved: true } },
    });
    expect(isEnvidoWindowOpen(state, "A")).toBe(false);
  });

  it("closed in round 2", () => {
    const state = buildMatch({
      hand: {
        ...buildMatch().hand,
        rounds: [
          { roundNumber: 1, trick: { cardsPlayed: [], winner: "A", resolved: true } },
          { roundNumber: 2, trick: { cardsPlayed: [], winner: null, resolved: false } },
        ],
      },
    });
    expect(isEnvidoWindowOpen(state, "A")).toBe(false);
  });

  it("closed when caller already played in current trick", () => {
    const state = buildMatch({
      hand: {
        ...buildMatch().hand,
        rounds: [
          {
            roundNumber: 1,
            trick: {
              cardsPlayed: [{ playerId: "A", card: { suit: "oro", rank: 1 } }],
              winner: null,
              resolved: false,
            },
          },
        ],
      },
    });
    expect(isEnvidoWindowOpen(state, "A")).toBe(false);
  });
});

// ── callEnvido ───────────────────────────────────────────────────────

describe("callEnvido", () => {
  it("valid call sets pending and transfers turn", () => {
    const state = buildMatch();
    const res = callEnvido(state, "A", "envido");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.state.hand.envidoState.pendingEnvido?.level).toBe("envido");
    expect(res.state.currentTurn).toBe("B");
    expect(res.state.hand.envidoState.history).toHaveLength(1);
  });

  it("skip to real_envido is valid", () => {
    const res = callEnvido(buildMatch(), "A", "real_envido");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.state.hand.envidoState.pendingEnvido?.level).toBe("real_envido");
  });

  it("blocked in round 2", () => {
    const state = buildMatch({
      hand: {
        ...buildMatch().hand,
        rounds: [
          { roundNumber: 1, trick: { cardsPlayed: [], winner: "A", resolved: true } },
          { roundNumber: 2, trick: { cardsPlayed: [], winner: null, resolved: false } },
        ],
      },
    });
    const res = callEnvido(state, "A", "envido");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("ENVIDO_WINDOW_CLOSED");
  });

  it("blocked when caller already played", () => {
    const state = buildMatch({
      hand: {
        ...buildMatch().hand,
        rounds: [
          {
            roundNumber: 1,
            trick: {
              cardsPlayed: [{ playerId: "A", card: { suit: "oro", rank: 1 } }],
              winner: null,
              resolved: false,
            },
          },
        ],
      },
    });
    const res = callEnvido(state, "A", "envido");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("ENVIDO_WINDOW_CLOSED");
  });

  it("blocked when truco is pending", () => {
    const state = buildMatch({
      hand: {
        ...buildMatch().hand,
        callState: {
          pendingCall: { caller: "B", level: "truco", status: "pending" },
          acceptedLevel: null,
          history: [],
        },
      },
    });
    const res = callEnvido(state, "A", "envido");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CALL_PENDING");
  });

  it("blocked when already resolved", () => {
    const state = buildMatch({
      hand: { ...buildMatch().hand, envidoState: { ...emptyEnvidoState(), resolved: true } },
    });
    const res = callEnvido(state, "A", "envido");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("ENVIDO_WINDOW_CLOSED");
  });

  it("falta_envido after falta_envido rejected (terminal)", () => {
    const state = buildMatch({
      hand: {
        ...buildMatch().hand,
        envidoState: { ...emptyEnvidoState(), acceptedLevel: "falta_envido" },
      },
    });
    const res = callEnvido(state, "A", "falta_envido");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("ENVIDO_INVALID_LEVEL");
  });

  it("blocked when match is over", () => {
    const res = callEnvido(buildMatch({ phase: "matchOver", winner: "team-A" }), "A", "envido");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("MATCH_OVER");
  });

  it("blocked when out of turn", () => {
    const res = callEnvido(buildMatch({ currentTurn: "B" }), "A", "envido");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("OUT_OF_TURN");
  });

  it("counter-call allowed when responder raises", () => {
    const state = buildMatch({
      currentTurn: "B",
      hand: {
        ...buildMatch().hand,
        envidoState: {
          ...emptyEnvidoState(),
          pendingEnvido: { caller: "A", level: "envido", status: "pending" },
        },
      },
    });
    // B (currentTurn, responder) counter-calls real_envido
    const res = callEnvido(state, "B", "real_envido");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Implicitly accepted envido: stake = 2, acceptedLevel = "envido"
    expect(res.state.hand.envidoState.stake).toBe(2);
    expect(res.state.hand.envidoState.acceptedLevel).toBe("envido");
    // New pending envido at real_envido level
    expect(res.state.hand.envidoState.pendingEnvido?.level).toBe("real_envido");
    expect(res.state.hand.envidoState.pendingEnvido?.caller).toBe("B");
    // Turn goes back to original caller (A)
    expect(res.state.currentTurn).toBe("A");
  });
});

// ── callEnvido counter-calls ─────────────────────────────────────────

describe("callEnvido counter-calls", () => {
  it("envido → envido same-level recanto", () => {
    // A calls envido, B counter-calls envido (same level)
    const state = buildMatch();
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const r2 = callEnvido(r1.state, "B", "envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // Implicitly accepted: stake = 2, acceptedLevel = "envido"
    expect(r2.state.hand.envidoState.stake).toBe(2);
    expect(r2.state.hand.envidoState.acceptedLevel).toBe("envido");
    // New pending at same level
    expect(r2.state.hand.envidoState.pendingEnvido?.level).toBe("envido");
    expect(r2.state.hand.envidoState.pendingEnvido?.caller).toBe("B");
    // Turn back to A
    expect(r2.state.currentTurn).toBe("A");
  });

  it("envido → real_envido counter-call", () => {
    const state = buildMatch();
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const r2 = callEnvido(r1.state, "B", "real_envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.hand.envidoState.stake).toBe(2);
    expect(r2.state.hand.envidoState.acceptedLevel).toBe("envido");
    expect(r2.state.hand.envidoState.pendingEnvido?.level).toBe("real_envido");
    expect(r2.state.currentTurn).toBe("A");
  });

  it("envido → falta_envido counter-call", () => {
    const state = buildMatch();
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const r2 = callEnvido(r1.state, "B", "falta_envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.hand.envidoState.stake).toBe(2);
    expect(r2.state.hand.envidoState.acceptedLevel).toBe("envido");
    expect(r2.state.hand.envidoState.pendingEnvido?.level).toBe("falta_envido");
    expect(r2.state.currentTurn).toBe("A");
  });

  it("real_envido → real_envido same-level recanto", () => {
    const state = buildMatch();
    const r1 = callEnvido(state, "A", "real_envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const r2 = callEnvido(r1.state, "B", "real_envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.state.hand.envidoState.stake).toBe(3);
    expect(r2.state.hand.envidoState.acceptedLevel).toBe("real_envido");
    expect(r2.state.hand.envidoState.pendingEnvido?.level).toBe("real_envido");
    expect(r2.state.currentTurn).toBe("A");
  });

  it("falta_envido → falta_envido blocked (terminal)", () => {
    const state = buildMatch();
    const r1 = callEnvido(state, "A", "falta_envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const r2 = callEnvido(r1.state, "B", "falta_envido");
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe("ENVIDO_INVALID_LEVEL");
  });

  it("chain: envido → envido → real_envido accumulates correctly", () => {
    const state = buildMatch();
    // A calls envido
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    // B counter-calls envido (stake = 2, accepted = "envido")
    const r2 = callEnvido(r1.state, "B", "envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // A counter-calls real_envido (stake = 2 + 2 = 4, accepted = "envido")
    const r3 = callEnvido(r2.state, "A", "real_envido");
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    expect(r3.state.hand.envidoState.stake).toBe(4);
    expect(r3.state.hand.envidoState.acceptedLevel).toBe("envido");
    expect(r3.state.hand.envidoState.pendingEnvido?.level).toBe("real_envido");
    expect(r3.state.currentTurn).toBe("B");
  });

  it("counter-call adds history entries for accept + issue", () => {
    const state = buildMatch();
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const r2 = callEnvido(r1.state, "B", "real_envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // History: A issued envido, B accepted envido, B issued real_envido
    expect(r2.state.hand.envidoState.history).toHaveLength(3);
    expect(r2.state.hand.envidoState.history[0]?.action).toBe("issued");
    expect(r2.state.hand.envidoState.history[0]?.actor).toBe("A");
    expect(r2.state.hand.envidoState.history[1]?.action).toBe("accepted");
    expect(r2.state.hand.envidoState.history[1]?.actor).toBe("B");
    expect(r2.state.hand.envidoState.history[2]?.action).toBe("issued");
    expect(r2.state.hand.envidoState.history[2]?.actor).toBe("B");
  });
});

// ── acceptEnvido ─────────────────────────────────────────────────────

describe("acceptEnvido", () => {
  it("higher points wins", () => {
    // A: oro-1 + oro-7 = 28; B: espada-1 + espada-2 = 23
    const state = buildWithCards(
      [
        { suit: "oro", rank: 1 },
        { suit: "oro", rank: 7 },
        { suit: "basto", rank: 3 },
      ],
      [
        { suit: "espada", rank: 1 },
        { suit: "espada", rank: 2 },
        { suit: "copa", rank: 3 },
      ],
    );
    const callRes = callEnvido(state, "A", "envido");
    expect(callRes.ok).toBe(true);
    if (!callRes.ok) return;

    const acceptRes = acceptEnvido(callRes.state, "B");
    expect(acceptRes.ok).toBe(true);
    if (!acceptRes.ok) return;
    expect(acceptRes.state.teams[0]?.score).toBe(2);
    expect(acceptRes.state.hand.envidoState.resolved).toBe(true);
  });

  it("tie → mano wins", () => {
    const state = buildWithCards(
      [
        { suit: "oro", rank: 7 },
        { suit: "oro", rank: 6 },
        { suit: "basto", rank: 1 },
      ],
      [
        { suit: "espada", rank: 7 },
        { suit: "espada", rank: 6 },
        { suit: "copa", rank: 1 },
      ],
    );
    const callRes = callEnvido(state, "A", "envido");
    expect(callRes.ok).toBe(true);
    if (!callRes.ok) return;

    const acceptRes = acceptEnvido(callRes.state, "B");
    expect(acceptRes.ok).toBe(true);
    if (!acceptRes.ok) return;
    // Tie → mano (A) wins
    expect(acceptRes.state.teams[0]?.score).toBe(2);
  });

  it("falta envido accept awards deficit and can end match", () => {
    const state = buildWithCards(
      [
        { suit: "oro", rank: 1 },
        { suit: "oro", rank: 7 },
        { suit: "basto", rank: 3 },
      ],
      [
        { suit: "espada", rank: 1 },
        { suit: "espada", rank: 2 },
        { suit: "copa", rank: 3 },
      ],
      12,
      10,
    );
    const callRes = callEnvido(state, "A", "falta_envido");
    expect(callRes.ok).toBe(true);
    if (!callRes.ok) return;

    const acceptRes = acceptEnvido(callRes.state, "B");
    expect(acceptRes.ok).toBe(true);
    if (!acceptRes.ok) return;
    // A wins (28 > 23). A gets faltaPoints = max(1, 15-12) = 3
    expect(acceptRes.state.teams[0]?.score).toBe(15);
    expect(acceptRes.state.phase).toBe("matchOver");
  });

  it("accumulated: envido + envido counter + accept = 4 pts", () => {
    // A: oro-1 + oro-7 = 28; B: espada-1 + espada-2 = 23
    const state = buildWithCards(
      [
        { suit: "oro", rank: 1 },
        { suit: "oro", rank: 7 },
        { suit: "basto", rank: 3 },
      ],
      [
        { suit: "espada", rank: 1 },
        { suit: "espada", rank: 2 },
        { suit: "copa", rank: 3 },
      ],
    );
    // A calls envido
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    // B counter-calls envido (stake = 2, accepted = "envido", pending = {B, envido})
    const r2 = callEnvido(r1.state, "B", "envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // A accepts (turn was back on A)
    const r3 = acceptEnvido(r2.state, "A");
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    // A wins (28 > 23). Awarded = stake + levelPoints("envido") = 2 + 2 = 4
    expect(r3.state.teams[0]?.score).toBe(4);
    expect(r3.state.hand.envidoState.resolved).toBe(true);
  });

  it("accumulated: envido + real_envido counter + accept = 5 pts", () => {
    const state = buildWithCards(
      [
        { suit: "oro", rank: 1 },
        { suit: "oro", rank: 7 },
        { suit: "basto", rank: 3 },
      ],
      [
        { suit: "espada", rank: 1 },
        { suit: "espada", rank: 2 },
        { suit: "copa", rank: 3 },
      ],
    );
    // A calls envido
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    // B counter-calls real_envido (stake = 2, accepted = "envido", pending = {B, real_envido})
    const r2 = callEnvido(r1.state, "B", "real_envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // A accepts
    const r3 = acceptEnvido(r2.state, "A");
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    // A wins (28 > 23). Awarded = stake + levelPoints("real_envido") = 2 + 3 = 5
    expect(r3.state.teams[0]?.score).toBe(5);
  });
});

// ── rejectEnvido ─────────────────────────────────────────────────────

describe("rejectEnvido", () => {
  it("initial envido rejection = 1pt", () => {
    const callRes = callEnvido(buildMatch(), "A", "envido");
    expect(callRes.ok).toBe(true);
    if (!callRes.ok) return;

    const rejectRes = rejectEnvido(callRes.state, "B");
    expect(rejectRes.ok).toBe(true);
    if (!rejectRes.ok) return;
    expect(rejectRes.state.teams[0]?.score).toBe(1);
    expect(rejectRes.state.hand.envidoState.resolved).toBe(true);
  });

  it("real_envido cold rejection = 2pt", () => {
    const callRes = callEnvido(buildMatch(), "A", "real_envido");
    expect(callRes.ok).toBe(true);
    if (!callRes.ok) return;

    const rejectRes = rejectEnvido(callRes.state, "B");
    expect(rejectRes.ok).toBe(true);
    if (!rejectRes.ok) return;
    expect(rejectRes.state.teams[0]?.score).toBe(2);
  });

  it("falta envido rejection awards caller's deficit", () => {
    const state = buildWithCards(
      [
        { suit: "oro", rank: 1 },
        { suit: "oro", rank: 7 },
        { suit: "basto", rank: 3 },
      ],
      [
        { suit: "espada", rank: 1 },
        { suit: "espada", rank: 2 },
        { suit: "copa", rank: 3 },
      ],
      10,
      5,
    );
    const callRes = callEnvido(state, "A", "falta_envido");
    expect(callRes.ok).toBe(true);
    if (!callRes.ok) return;

    const rejectRes = rejectEnvido(callRes.state, "B");
    expect(rejectRes.ok).toBe(true);
    if (!rejectRes.ok) return;
    // Caller (A) wins faltaPoints = max(1, 15-10) = 5
    expect(rejectRes.state.teams[0]?.score).toBe(15);
  });

  it("reject after counter-call: envido→envido counter, reject = 3 pts", () => {
    const state = buildMatch();
    // A calls envido
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    // B counter-calls envido (stake = 2, pending = {B, envido})
    const r2 = callEnvido(r1.state, "B", "envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // A rejects (turn was back on A)
    const r3 = rejectEnvido(r2.state, "A");
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    // B (caller of pending) wins: max(stake + 1, levelPoints("envido") - 1) = max(3, 1) = 3
    expect(r3.state.teams[1]?.score).toBe(3);
    expect(r3.state.hand.envidoState.resolved).toBe(true);
    // Turn goes to opponent of responder (A), which is B
    expect(r3.state.currentTurn).toBe("B");
  });

  it("reject after counter-call: envido→real_envido counter, reject = 3 pts", () => {
    const state = buildMatch();
    // A calls envido
    const r1 = callEnvido(state, "A", "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    // B counter-calls real_envido (stake = 2, pending = {B, real_envido})
    const r2 = callEnvido(r1.state, "B", "real_envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // A rejects
    const r3 = rejectEnvido(r2.state, "A");
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    // B wins: max(stake + 1, levelPoints("real_envido") - 1) = max(3, 2) = 3
    expect(r3.state.teams[1]?.score).toBe(3);
  });
});

// ── scoreEnvido ──────────────────────────────────────────────────────

describe("scoreEnvido", () => {
  it("adds score without dealing new hand", () => {
    const scored = scoreEnvido(buildMatch(), "A", 2);
    expect(scored.teams[0]?.score).toBe(2);
    expect(scored.hand.handNumber).toBe(1);
  });

  it("matchOver at target", () => {
    const state = buildWithCards([{ suit: "oro", rank: 1 }], [{ suit: "basto", rank: 1 }], 13, 10);
    const scored = scoreEnvido(state, "A", 2);
    expect(scored.phase).toBe("matchOver");
    expect(scored.winner).toBe("team-A");
  });
});

// ── faltaPoints ──────────────────────────────────────────────────────

describe("faltaPoints", () => {
  it("15-pt match at 12 wins 3", () => {
    expect(faltaPoints(buildWithCards([], [], 12, 10), 0)).toBe(3);
  });

  it("30-pt match at 10 wins 20", () => {
    const state = buildMatch({
      pointsToWin: 30,
      teams: [
        { id: "team-A", players: [playerA], score: 10 },
        { id: "team-B", players: [playerB], score: 10 },
      ],
    });
    expect(faltaPoints(state, 0)).toBe(20);
  });

  it("rejection at 10 wins 5", () => {
    expect(faltaPoints(buildWithCards([], [], 10, 5), 0)).toBe(5);
  });
});
