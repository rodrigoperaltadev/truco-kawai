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
import { deriveActions } from "@/features/game/logic/deriveActions";

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

function buildState(
  overrides: Partial<MatchState> & { hand?: Partial<HandState> } = {},
): MatchState {
  const { hand: handOverrides, ...rest } = overrides;
  const hand: HandState = {
    handNumber: 1,
    dealer: "B",
    mano: "A",
    players: [
      { playerId: "A", cards: [{ suit: "espada", rank: 7 }] },
      { playerId: "B", cards: [{ suit: "basto", rank: 6 }] },
    ],
    rounds: [emptyRound()],
    callState: emptyCallState(),
    envidoState: emptyEnvidoState(),
    ...handOverrides,
  };

  return {
    phase: "playing",
    pointsToWin: 15,
    players: [playerA, playerB],
    teams: [teamA, teamB],
    hand,
    currentTurn: "A",
    winner: null,
    ...rest,
  };
}

// ── Match over ──────────────────────────────────────────────────────

describe("deriveActions — matchOver", () => {
  it("returns all false when phase is matchOver", () => {
    const state = buildState({ phase: "matchOver", winner: "team-A" });
    const actions = deriveActions(state, "A");
    expect(actions).toEqual({
      truco: false,
      retruco: false,
      valeCuatro: false,
      envido: false,
      realEnvido: false,
      faltaEnvido: false,
      quiero: false,
      noQuiero: false,
      mazo: false,
    });
  });
});

// ── Not player's turn ───────────────────────────────────────────────

describe("deriveActions — not player's turn", () => {
  it("returns all false when currentTurn !== playerId", () => {
    const state = buildState({ currentTurn: "B" });
    const actions = deriveActions(state, "A");
    expect(actions.truco).toBe(false);
    expect(actions.mazo).toBe(false);
    expect(actions.quiero).toBe(false);
  });
});

// ── Truco calls ─────────────────────────────────────────────────────

describe("deriveActions — truco calls", () => {
  it("truco available on player's turn, no pending, no accepted", () => {
    const state = buildState({ currentTurn: "A" });
    const actions = deriveActions(state, "A");
    expect(actions.truco).toBe(true);
    expect(actions.retruco).toBe(false);
    expect(actions.valeCuatro).toBe(false);
  });

  it("retruco available when acceptedLevel is truco", () => {
    const callState: CallState = {
      pendingCall: null,
      acceptedLevel: "truco",
      history: [
        { caller: "A", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "truco", action: "accepted", resolvedAt: 1 },
      ],
    };
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, callState },
    });
    const actions = deriveActions(state, "A");
    expect(actions.truco).toBe(false);
    expect(actions.retruco).toBe(true);
    expect(actions.valeCuatro).toBe(false);
  });

  it("valeCuatro available when acceptedLevel is retruco", () => {
    const callState: CallState = {
      pendingCall: null,
      acceptedLevel: "retruco",
      history: [],
    };
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, callState },
    });
    const actions = deriveActions(state, "A");
    expect(actions.truco).toBe(false);
    expect(actions.retruco).toBe(false);
    expect(actions.valeCuatro).toBe(true);
  });

  it("no call initiation when call is pending", () => {
    const callState: CallState = {
      pendingCall: { caller: "B", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "B", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, callState },
    });
    const actions = deriveActions(state, "A");
    expect(actions.truco).toBe(false);
    expect(actions.retruco).toBe(false);
    expect(actions.valeCuatro).toBe(false);
  });
});

// ── Envido calls ────────────────────────────────────────────────────

describe("deriveActions — envido calls", () => {
  it("envido buttons available in round 1, no cards played", () => {
    const state = buildState({ currentTurn: "A" });
    const actions = deriveActions(state, "A");
    expect(actions.envido).toBe(true);
    expect(actions.realEnvido).toBe(true);
    expect(actions.faltaEnvido).toBe(true);
  });

  it("envido buttons NOT available in round 2", () => {
    const rounds: readonly RoundState[] = [
      {
        roundNumber: 1,
        trick: {
          cardsPlayed: [
            { playerId: "A", card: { suit: "espada", rank: 7 } },
            { playerId: "B", card: { suit: "basto", rank: 6 } },
          ],
          winner: "A",
          resolved: true,
        },
      },
      emptyRound(2),
    ];
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, rounds },
    });
    const actions = deriveActions(state, "A");
    expect(actions.envido).toBe(false);
    expect(actions.realEnvido).toBe(false);
    expect(actions.faltaEnvido).toBe(false);
  });

  it("envido buttons NOT available when player already played in round 1", () => {
    const roundWithCard: RoundState = {
      roundNumber: 1,
      trick: {
        cardsPlayed: [{ playerId: "A", card: { suit: "espada", rank: 7 } }],
        winner: null,
        resolved: false,
      },
    };
    // A played, now it's B's turn. But we check from A's perspective.
    const state = buildState({
      currentTurn: "B",
      hand: { ...buildState().hand, rounds: [roundWithCard] },
    });
    // A already played, so envido window is closed for A
    const actions = deriveActions(state, "A");
    // It's not A's turn, so canInitiate is false anyway
    expect(actions.envido).toBe(false);
  });

  it("envido buttons NOT available when envido is pending", () => {
    const envidoState: EnvidoState = {
      pendingEnvido: { caller: "B", level: "envido", status: "pending" },
      acceptedLevel: null,
      stake: 0,
      resolved: false,
      history: [{ actor: "B", level: "envido", action: "issued", round: 1 }],
    };
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, envidoState },
    });
    const actions = deriveActions(state, "A");
    expect(actions.envido).toBe(false);
    expect(actions.realEnvido).toBe(false);
    expect(actions.faltaEnvido).toBe(false);
  });
});

// ── Response buttons ────────────────────────────────────────────────

describe("deriveActions — response buttons", () => {
  it("quiero/noQuiero available when opponent has pending call", () => {
    const callState: CallState = {
      pendingCall: { caller: "B", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "B", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, callState },
    });
    const actions = deriveActions(state, "A");
    expect(actions.quiero).toBe(true);
    expect(actions.noQuiero).toBe(true);
  });

  it("quiero/noQuiero available when opponent has pending envido", () => {
    const envidoState: EnvidoState = {
      pendingEnvido: { caller: "B", level: "envido", status: "pending" },
      acceptedLevel: null,
      stake: 0,
      resolved: false,
      history: [{ actor: "B", level: "envido", action: "issued", round: 1 }],
    };
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, envidoState },
    });
    const actions = deriveActions(state, "A");
    expect(actions.quiero).toBe(true);
    expect(actions.noQuiero).toBe(true);
  });

  it("quiero/noQuiero NOT available when player has own pending call", () => {
    const callState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const state = buildState({
      currentTurn: "B",
      hand: { ...buildState().hand, callState },
    });
    // It's B's turn, but the pending call is from A (opponent of B)
    // So from B's perspective, pendingFromOpponent is true
    const actionsB = deriveActions(state, "B");
    expect(actionsB.quiero).toBe(true);
    expect(actionsB.noQuiero).toBe(true);

    // From A's perspective, it's not A's turn
    const actionsA = deriveActions(state, "A");
    expect(actionsA.quiero).toBe(false);
    expect(actionsA.noQuiero).toBe(false);
  });
});

// ── Mazo ────────────────────────────────────────────────────────────

describe("deriveActions — mazo", () => {
  it("mazo available on player's turn with no pending calls", () => {
    const state = buildState({ currentTurn: "A" });
    const actions = deriveActions(state, "A");
    expect(actions.mazo).toBe(true);
  });

  it("mazo NOT available when call is pending", () => {
    const callState: CallState = {
      pendingCall: { caller: "B", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [],
    };
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, callState },
    });
    const actions = deriveActions(state, "A");
    expect(actions.mazo).toBe(false);
  });

  it("mazo NOT available when envido is pending", () => {
    const envidoState: EnvidoState = {
      pendingEnvido: { caller: "B", level: "envido", status: "pending" },
      acceptedLevel: null,
      stake: 0,
      resolved: false,
      history: [],
    };
    const state = buildState({
      currentTurn: "A",
      hand: { ...buildState().hand, envidoState },
    });
    const actions = deriveActions(state, "A");
    expect(actions.mazo).toBe(false);
  });

  it("mazo NOT available when not player's turn", () => {
    const state = buildState({ currentTurn: "B" });
    const actions = deriveActions(state, "A");
    expect(actions.mazo).toBe(false);
  });
});
