import { act, renderHook } from "@testing-library/react-native";

import type { Card } from "@/domain/deck";
import type { Player } from "@/domain/game/types";
import { useGameState } from "@/features/game/hooks/useGameState";

// ── Helpers ─────────────────────────────────────────────────────────

const playerA: Player = { id: "human", name: "Alice" };
const playerB: Player = { id: "cpu", name: "Bob" };

/**
 * Deterministic RNG that always returns 0.5 (for reproducible shuffles).
 */
function seededRng(): () => number {
  let seed = 42;
  return () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };
}

function renderGameHook(overrides: Partial<Parameters<typeof useGameState>[0]> = {}) {
  return renderHook(() =>
    useGameState({
      players: [playerA, playerB],
      pointsToWin: 15,
      rng: seededRng(),
      playerId: "human",
      ...overrides,
    }),
  );
}

// ── Initial state ───────────────────────────────────────────────────

describe("useGameState — initial state", () => {
  it("creates a match and derives the initial view", () => {
    const { result } = renderGameHook();

    expect(result.current.view.phase).toBe("playing");
    expect(result.current.view.handNumber).toBe(1);
    expect(result.current.view.playerHand.length).toBe(3);
    expect(result.current.view.opponentCardCount).toBe(3);
    expect(result.current.view.scores).toEqual({ nos: 0, ellos: 0 });
    expect(result.current.log).toEqual([]);
  });

  it("mano is the initial currentTurn", () => {
    const { result } = renderGameHook();
    // Hand 1: dealer = players[1] (cpu), mano = players[0] (human)
    expect(result.current.view.isPlayerTurn).toBe(true);
  });
});

// ── Play card ───────────────────────────────────────────────────────

describe("useGameState — play card", () => {
  it("plays a card and appends a log entry", () => {
    const { result } = renderGameHook();

    const card = result.current.view.playerHand[0];
    if (!card) throw new Error("Expected a card in hand");

    act(() => {
      result.current.handlers.onPlayCard(card);
    });

    // Card was played → log should have at least one entry
    expect(result.current.log.length).toBeGreaterThanOrEqual(1);
    const playEntry = result.current.log.find((e) => e.kind === "play");
    expect(playEntry).toBeDefined();
    expect(playEntry?.actorName).toBe("Alice");
  });

  it("turn passes to opponent after playing", () => {
    const { result } = renderGameHook();

    const card = result.current.view.playerHand[0];
    if (!card) throw new Error("Expected a card in hand");

    act(() => {
      result.current.handlers.onPlayCard(card);
    });

    // After playing, it should be the opponent's turn
    expect(result.current.view.isPlayerTurn).toBe(false);
  });
});

// ── Call flow ───────────────────────────────────────────────────────

describe("useGameState — call flow", () => {
  it("human calls truco, log entry is appended", () => {
    const { result } = renderGameHook();

    // Ensure it's the player's turn
    expect(result.current.view.isPlayerTurn).toBe(true);

    act(() => {
      result.current.handlers.onCall("truco");
    });

    const callEntry = result.current.log.find((e) => e.kind === "call");
    expect(callEntry).toBeDefined();
    expect(callEntry?.text).toContain("Truco");
    expect(callEntry?.actorName).toBe("Alice");

    // After calling, turn goes to opponent
    expect(result.current.view.isPlayerTurn).toBe(false);
  });

  it("opponent accepts truco, then it's caller's turn", () => {
    const { result } = renderGameHook();

    // Human calls truco
    act(() => {
      result.current.handlers.onCall("truco");
    });

    // Now it's opponent's turn with pending call.
    // Simulate opponent accepting by dispatching ACCEPT.
    // The reducer uses currentTurn as responder.
    act(() => {
      result.current.handlers.onAccept();
    });

    const acceptEntry = result.current.log.find((e) => e.kind === "callResponse");
    expect(acceptEntry).toBeDefined();
    expect(acceptEntry?.text).toContain("quiso");

    // After acceptance, turn goes back to the caller (human)
    expect(result.current.view.isPlayerTurn).toBe(true);
  });

  it("opponent rejects truco, hand resolves", () => {
    const { result } = renderGameHook();

    // Human calls truco
    act(() => {
      result.current.handlers.onCall("truco");
    });

    // Opponent rejects
    act(() => {
      result.current.handlers.onReject();
    });

    const rejectEntry = result.current.log.find((e) => e.kind === "callResponse");
    expect(rejectEntry).toBeDefined();
    expect(rejectEntry?.text).toContain("no quiso");

    // After rejection, the hand resolves (caller wins 1pt, new hand dealt)
    // The caller is "human", so human's team gets 1 pt
    expect(result.current.view.scores.nos).toBe(1);
    // New hand dealt
    expect(result.current.view.handNumber).toBe(2);
  });
});

// ── Mazo (fold) ─────────────────────────────────────────────────────

describe("useGameState — mazo", () => {
  it("folding appends a fold log entry and awards points to opponent", () => {
    const { result } = renderGameHook();

    // Human is mano, it's human's turn, round 1, no cards played
    // Branch 3: mano folds on round 1 → opponent gets 2 pts
    act(() => {
      result.current.handlers.onMazo();
    });

    const foldEntry = result.current.log.find((e) => e.kind === "fold");
    expect(foldEntry).toBeDefined();
    expect(foldEntry?.actorName).toBe("Alice");
    expect(foldEntry?.text).toContain("mazo");

    // Opponent (Bob) gets 2 points (branch 3: mano fold on round 1)
    expect(result.current.view.scores.ellos).toBe(2);
    // New hand dealt
    expect(result.current.view.handNumber).toBe(2);
  });
});

// ── Opponent auto-play ──────────────────────────────────────────────

describe("useGameState — opponent auto-play", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("opponent plays a card automatically after delay", () => {
    const { result } = renderGameHook();

    // Human plays a card first (to pass turn to opponent)
    const card = result.current.view.playerHand[0];
    if (!card) throw new Error("Expected a card in hand");

    act(() => {
      result.current.handlers.onPlayCard(card);
    });

    // Now it's opponent's turn
    expect(result.current.view.isPlayerTurn).toBe(false);
    const opponentCardCountBefore = result.current.view.opponentCardCount;

    // Advance timer to trigger opponent auto-play
    act(() => {
      jest.advanceTimersByTime(700);
    });

    // Opponent should have played a card
    expect(result.current.view.opponentCardCount).toBe(opponentCardCountBefore - 1);
    // Turn should be back to player (or trick resolved)
    const playEntries = result.current.log.filter((e) => e.kind === "play");
    expect(playEntries.length).toBeGreaterThanOrEqual(2); // human + opponent
  });

  it("does NOT auto-play when a call is pending", () => {
    const { result } = renderGameHook();

    // Human calls truco → turn goes to opponent with pending call
    act(() => {
      result.current.handlers.onCall("truco");
    });

    expect(result.current.view.isPlayerTurn).toBe(false);
    const opponentCardCountBefore = result.current.view.opponentCardCount;

    // Advance timer — opponent should NOT play because call is pending
    act(() => {
      jest.advanceTimersByTime(700);
    });

    // Opponent card count unchanged
    expect(result.current.view.opponentCardCount).toBe(opponentCardCountBefore);
  });

  it("cleans up timer on state change", () => {
    const { result, unmount } = renderGameHook();

    // Human plays a card → opponent's turn
    const card = result.current.view.playerHand[0];
    if (!card) throw new Error("Expected a card in hand");

    act(() => {
      result.current.handlers.onPlayCard(card);
    });

    // Unmount before timer fires
    unmount();

    // Advancing timers should not throw
    expect(() => {
      jest.advanceTimersByTime(700);
    }).not.toThrow();
  });
});

// ── Envido flow ─────────────────────────────────────────────────────

describe("useGameState — envido flow", () => {
  it("human calls envido, log entry is appended", () => {
    const { result } = renderGameHook();

    expect(result.current.view.isPlayerTurn).toBe(true);

    act(() => {
      result.current.handlers.onCallEnvido("envido");
    });

    const envidoEntry = result.current.log.find((e) => e.kind === "envido");
    expect(envidoEntry).toBeDefined();
    expect(envidoEntry?.text).toContain("Envido");
    expect(envidoEntry?.actorName).toBe("Alice");

    // After calling envido, turn goes to opponent
    expect(result.current.view.isPlayerTurn).toBe(false);
  });
});

// ── Action gating ───────────────────────────────────────────────────

describe("useGameState — action gating", () => {
  it("actions reflect current state", () => {
    const { result } = renderGameHook();

    // Player's turn, round 1, no pending → truco and envido available
    expect(result.current.actions.truco).toBe(true);
    expect(result.current.actions.envido).toBe(true);
    expect(result.current.actions.mazo).toBe(true);
    expect(result.current.actions.quiero).toBe(false);
  });

  it("after calling truco, call buttons are hidden", () => {
    const { result } = renderGameHook();

    act(() => {
      result.current.handlers.onCall("truco");
    });

    // Pending call → no call initiation
    expect(result.current.actions.truco).toBe(false);
    expect(result.current.actions.retruco).toBe(false);
    // Response buttons for opponent (not for human since human initiated)
    expect(result.current.actions.quiero).toBe(false);
    expect(result.current.actions.noQuiero).toBe(false);
  });
});
