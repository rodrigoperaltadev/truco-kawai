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
import {
  assignIds,
  deriveCallLogEntries,
  deriveEnvidoLogEntries,
  derivePlayLogEntries,
  foldLogEntry,
} from "@/features/game/logic/logEntry";

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

// ── derivePlayLogEntries ────────────────────────────────────────────

describe("derivePlayLogEntries", () => {
  it("detects a new card play", () => {
    const prev = buildState();
    const next = buildState({
      hand: {
        ...buildState().hand,
        rounds: [
          {
            roundNumber: 1,
            trick: {
              cardsPlayed: [{ playerId: "A", card: { suit: "espada", rank: 7 } }],
              winner: null,
              resolved: false,
            },
          },
        ],
      },
    });

    const entries = derivePlayLogEntries(prev, next);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe("play");
    expect(entries[0]?.actorName).toBe("Alice");
    expect(entries[0]?.text).toBe("Alice: 7 Espada");
  });

  it("detects trick resolution with winner", () => {
    const prev = buildState({
      hand: {
        ...buildState().hand,
        rounds: [
          {
            roundNumber: 1,
            trick: {
              cardsPlayed: [
                { playerId: "A", card: { suit: "espada", rank: 7 } },
                { playerId: "B", card: { suit: "basto", rank: 6 } },
              ],
              winner: null,
              resolved: false,
            },
          },
        ],
      },
    });
    const next = buildState({
      hand: {
        ...buildState().hand,
        rounds: [
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
        ],
      },
    });

    const entries = derivePlayLogEntries(prev, next);
    // No new cards (same cardsPlayed), but trick resolved
    const trickEntry = entries.find((e) => e.kind === "trick");
    expect(trickEntry).toBeDefined();
    expect(trickEntry?.actorName).toBe("Alice");
    expect(trickEntry?.text).toContain("ganó la baza");
  });

  it("detects trick tie", () => {
    const prev = buildState();
    const next = buildState({
      hand: {
        ...buildState().hand,
        rounds: [
          {
            roundNumber: 1,
            trick: {
              cardsPlayed: [
                { playerId: "A", card: { suit: "espada", rank: 7 } },
                { playerId: "B", card: { suit: "espada", rank: 7 } },
              ],
              winner: "tie",
              resolved: true,
            },
          },
        ],
      },
    });

    const entries = derivePlayLogEntries(prev, next);
    const trickEntry = entries.find((e) => e.kind === "trick");
    expect(trickEntry).toBeDefined();
    expect(trickEntry?.text).toContain("empate");
  });

  it("returns empty when nothing changed", () => {
    const state = buildState();
    const entries = derivePlayLogEntries(state, state);
    expect(entries).toHaveLength(0);
  });
});

// ── deriveCallLogEntries ────────────────────────────────────────────

describe("deriveCallLogEntries", () => {
  it("detects a new call issued", () => {
    const prev = buildState();
    const callState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const next = buildState({ hand: { ...buildState().hand, callState } });

    const entries = deriveCallLogEntries(prev, next);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe("call");
    expect(entries[0]?.actorName).toBe("Alice");
    expect(entries[0]?.text).toBe("Alice cantó Truco");
  });

  it("detects call accepted", () => {
    const prevCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const prev = buildState({ hand: { ...buildState().hand, callState: prevCallState } });

    const nextCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "accepted" },
      acceptedLevel: "truco",
      history: [
        { caller: "A", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "truco", action: "accepted", resolvedAt: 1 },
      ],
    };
    const next = buildState({ hand: { ...buildState().hand, callState: nextCallState } });

    const entries = deriveCallLogEntries(prev, next);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe("callResponse");
    expect(entries[0]?.actorName).toBe("Bob");
    expect(entries[0]?.text).toBe("Bob quiso Truco");
  });

  it("detects call rejected", () => {
    const prevCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "pending" },
      acceptedLevel: null,
      history: [{ caller: "A", level: "truco", action: "issued", resolvedAt: 1 }],
    };
    const prev = buildState({ hand: { ...buildState().hand, callState: prevCallState } });

    const nextCallState: CallState = {
      pendingCall: { caller: "A", level: "truco", status: "rejected" },
      acceptedLevel: null,
      history: [
        { caller: "A", level: "truco", action: "issued", resolvedAt: 1 },
        { caller: "B", level: "truco", action: "rejected", resolvedAt: 1 },
      ],
    };
    const next = buildState({ hand: { ...buildState().hand, callState: nextCallState } });

    const entries = deriveCallLogEntries(prev, next);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe("callResponse");
    expect(entries[0]?.text).toBe("Bob no quiso Truco");
  });
});

// ── deriveEnvidoLogEntries ──────────────────────────────────────────

describe("deriveEnvidoLogEntries", () => {
  it("detects envido issued", () => {
    const prev = buildState();
    const envidoState: EnvidoState = {
      pendingEnvido: { caller: "A", level: "envido", status: "pending" },
      acceptedLevel: null,
      stake: 0,
      resolved: false,
      history: [{ actor: "A", level: "envido", action: "issued", round: 1 }],
    };
    const next = buildState({ hand: { ...buildState().hand, envidoState } });

    const entries = deriveEnvidoLogEntries(prev, next);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe("envido");
    expect(entries[0]?.text).toBe("Alice cantó Envido");
  });

  it("detects real_envido issued", () => {
    const prev = buildState();
    const envidoState: EnvidoState = {
      pendingEnvido: { caller: "A", level: "real_envido", status: "pending" },
      acceptedLevel: null,
      stake: 0,
      resolved: false,
      history: [{ actor: "A", level: "real_envido", action: "issued", round: 1 }],
    };
    const next = buildState({ hand: { ...buildState().hand, envidoState } });

    const entries = deriveEnvidoLogEntries(prev, next);
    expect(entries[0]?.text).toBe("Alice cantó Real Envido");
  });
});

// ── foldLogEntry ────────────────────────────────────────────────────

describe("foldLogEntry", () => {
  it("builds a fold entry with actor name", () => {
    const state = buildState();
    const entry = foldLogEntry("A", state);
    expect(entry.kind).toBe("fold");
    expect(entry.actorName).toBe("Alice");
    expect(entry.text).toBe("Alice se fue al mazo");
  });

  it("uses player name from state", () => {
    const state = buildState();
    const entry = foldLogEntry("B", state);
    expect(entry.actorName).toBe("Bob");
    expect(entry.text).toBe("Bob se fue al mazo");
  });
});

// ── assignIds ───────────────────────────────────────────────────────

describe("assignIds", () => {
  it("assigns monotonic IDs starting from offset", () => {
    const raw = [
      { kind: "play" as const, actorName: "A", text: "a" },
      { kind: "play" as const, actorName: "B", text: "b" },
    ];
    const result = assignIds(raw, 5);
    expect(result[0]?.id).toBe("5");
    expect(result[1]?.id).toBe("6");
  });

  it("returns empty for empty input", () => {
    expect(assignIds([], 0)).toEqual([]);
  });
});
