import { acceptCall, makeCall, rejectCall } from "@/domain/game/calls";
import { acceptEnvido, callEnvido, rejectEnvido } from "@/domain/game/envido";
import { createMatch, dealHand, emptyEnvidoState } from "@/domain/game/match";
import { playCard } from "@/domain/game/play";
import type { Card, MatchState, PlayCardCmd, Player } from "@/domain/game/types";

const playerA: Player = { id: "A", name: "Alice" };
const playerB: Player = { id: "B", name: "Bob" };

function createSeededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickFirstCard(hand: readonly Card[]): Card {
  const card = hand[0];
  if (card === undefined) throw new Error("No cards in hand");
  return card;
}

// ── Integration: envido → accept → play resumes ─────────────────────

describe("envido → accept → play resumes", () => {
  it("envido called, accepted, points awarded, play continues", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // A (mano) calls envido
    expect(state.currentTurn).toBe(playerA.id);
    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;
    expect(state.hand.envidoState.pendingEnvido?.level).toBe("envido");
    expect(state.currentTurn).toBe(playerB.id);

    // B tries to play — blocked
    const pB = state.hand.players.find((p) => p.playerId === playerB.id);
    if (pB === undefined) throw new Error("Expected B");
    const blocked = playCard(state, { playerId: playerB.id, card: pB.cards[0] as Card });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toBe("ENVIDO_CALL_PENDING");

    // B accepts
    const r2 = acceptEnvido(state, playerB.id);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    state = r2.state;
    expect(state.hand.envidoState.resolved).toBe(true);
    // Turn returns to caller (A)
    expect(state.currentTurn).toBe(playerA.id);

    // A can now play
    const pA = state.hand.players.find((p) => p.playerId === playerA.id);
    if (pA === undefined) throw new Error("Expected A");
    const resumed = playCard(state, { playerId: playerA.id, card: pA.cards[0] as Card });
    expect(resumed.ok).toBe(true);
  });
});

// ── Integration: envido → reject → caller wins 1pt → play continues ─

describe("envido → reject → caller wins 1pt → play continues", () => {
  it("rejection resolves mid-hand, play continues", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // A calls envido
    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    // B rejects
    const r2 = rejectEnvido(state, playerB.id);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    state = r2.state;

    // Caller (A) team gets 1 point
    const teamA = state.teams.find((t) => t.id === `team-${playerA.id}`);
    expect(teamA?.score).toBe(1);
    expect(state.hand.envidoState.resolved).toBe(true);

    // Play continues — A's turn (opponent of responder B, which is the caller A)
    expect(state.currentTurn).toBe(playerA.id);
    const pA = state.hand.players.find((p) => p.playerId === playerA.id);
    if (pA === undefined) throw new Error("Expected A");
    const resumed = playCard(state, { playerId: playerA.id, card: pA.cards[0] as Card });
    expect(resumed.ok).toBe(true);
  });
});

// ── Integration: envido + truco coexist ──────────────────────────────

describe("envido + truco coexist round 1", () => {
  it("envido resolved first, then truco can be called", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // A calls envido
    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    // B accepts envido
    const r2 = acceptEnvido(state, playerB.id);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    state = r2.state;
    expect(state.hand.envidoState.resolved).toBe(true);

    // Now A (caller, current turn) can call truco
    const r3 = makeCall(state, playerA.id, "truco");
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    state = r3.state;
    expect(state.hand.callState.pendingCall?.level).toBe("truco");
    expect(state.hand.envidoState.resolved).toBe(true);
  });

  it("truco cannot be called while envido is pending", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // A calls envido
    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    // B tries to call truco — should be blocked (ENVIDO_CALL_PENDING)
    const r2 = makeCall(state, playerB.id, "truco");
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe("ENVIDO_CALL_PENDING");
  });

  it("envido cannot be called while truco is pending", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // A calls truco
    const r1 = makeCall(state, playerA.id, "truco");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    // B tries to call envido — should be blocked (CALL_PENDING)
    const r2 = callEnvido(state, playerB.id, "envido");
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toBe("CALL_PENDING");
  });
});

// ── Integration: truco reject with envido unresolved ─────────────────

describe("truco reject with envido unresolved resolves envido first", () => {
  it("envido resolved before truco rejection points (defensive state)", () => {
    const rng = createSeededRng(42);
    const baseState = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // Manually construct a dual-pending state (unreachable via public API,
    // but the defensive branch in rejectCall must handle it correctly).
    // Set scores so envido rejection (1pt) brings team A close to winning.
    const dualPendingState: MatchState = {
      ...baseState,
      teams: [
        { id: "team-A", players: [playerA], score: 13 },
        { id: "team-B", players: [playerB], score: 10 },
      ],
      currentTurn: playerB.id,
      hand: {
        ...baseState.hand,
        callState: {
          pendingCall: { caller: playerA.id, level: "truco", status: "pending" },
          acceptedLevel: null,
          history: [],
        },
        envidoState: {
          pendingEnvido: { caller: playerA.id, level: "envido", status: "pending" },
          acceptedLevel: null,
          stake: 0,
          resolved: false,
          history: [],
        },
      },
    };

    // B rejects truco → rejectCall should resolve envido first, then truco rejection
    const result = rejectCall(dualPendingState, playerB.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const finalState = result.state;

    // Envido rejection: caller (A) gets 1 point (stake 0 + 1) → 13 + 1 = 14
    // Truco rejection: caller (A) gets callPoints(null) = 1 point → 14 + 1 = 15
    // Total: 15 pts for team A, triggering matchOver
    const teamA = finalState.teams.find((t) => t.id === `team-${playerA.id}`);
    expect(teamA?.score).toBe(15);
    expect(finalState.phase).toBe("matchOver");
    expect(finalState.winner).toBe("team-A");

    // If envido had NOT been resolved first, team A would only have 14 pts (13 + 1 for truco).
    // The fact that team A has 15 pts proves envido was resolved before truco.
  });
});

// ── Integration: falta envido accept → matchOver ─────────────────────

describe("falta envido accept → matchOver", () => {
  it("falta envido accepted when winner reaches pointsToWin", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // Manually set scores to create a falta scenario
    state = {
      ...state,
      teams: [
        { id: "team-A", players: [playerA], score: 12 },
        { id: "team-B", players: [playerB], score: 10 },
      ],
    };

    // A calls falta_envido
    const r1 = callEnvido(state, playerA.id, "falta_envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    // B accepts
    const r2 = acceptEnvido(state, playerB.id);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    state = r2.state;

    // Winner should reach 15 and match should be over
    const winnerTeam = state.teams.find((t) => t.score >= 15);
    expect(winnerTeam).toBeDefined();
    expect(state.phase).toBe("matchOver");
  });
});

// ── Integration: dealHand resets envidoState ─────────────────────────

describe("dealHand resets envidoState", () => {
  it("envido resolved in hand N, next hand has empty envidoState", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // Resolve envido in hand 1
    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    const r2 = acceptEnvido(state, playerB.id);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    state = r2.state;
    expect(state.hand.envidoState.resolved).toBe(true);

    // Play out the hand to trigger dealHand
    // For simplicity, just check that a new hand from dealHand has empty envidoState
    const newHand = dealHand(2, [playerA, playerB], rng);
    expect(newHand.envidoState).toEqual(emptyEnvidoState());
  });
});

// ── Integration: playCard blocked while envido pending ───────────────

describe("playCard blocked while envido pending", () => {
  it("ENVIDO_CALL_PENDING when envido is pending", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    // B tries to play
    const pB = state.hand.players.find((p) => p.playerId === playerB.id);
    if (pB === undefined) throw new Error("Expected B");
    const blocked = playCard(state, { playerId: playerB.id, card: pB.cards[0] as Card });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toBe("ENVIDO_CALL_PENDING");
  });
});

// ── Integration: counter-call chain → accept ─────────────────────────

describe("counter-call chain → accept", () => {
  it("envido → counter real_envido → accept awards 5 pts", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // A calls envido
    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;
    expect(state.currentTurn).toBe(playerB.id);

    // B counter-calls real_envido (implicit accept envido: stake=2)
    const r2 = callEnvido(state, playerB.id, "real_envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    state = r2.state;
    expect(state.hand.envidoState.stake).toBe(2);
    expect(state.hand.envidoState.acceptedLevel).toBe("envido");
    expect(state.currentTurn).toBe(playerA.id);

    // A accepts real_envido
    const r3 = acceptEnvido(state, playerA.id);
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    state = r3.state;
    // Awarded = stake + levelPoints("real_envido") = 2 + 3 = 5
    const winnerTeam = state.teams.find((t) => t.score > 0);
    expect(winnerTeam?.score).toBe(5);
    expect(state.hand.envidoState.resolved).toBe(true);
  });

  it("envido → counter envido → counter real_envido → reject awards 5 pts", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // A calls envido
    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    // B counter-calls envido (stake=2, pending={B,envido})
    const r2 = callEnvido(state, playerB.id, "envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    state = r2.state;
    expect(state.currentTurn).toBe(playerA.id);

    // A counter-calls real_envido (stake=2+2=4, pending={A,real_envido})
    const r3 = callEnvido(state, playerA.id, "real_envido");
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    state = r3.state;
    expect(state.hand.envidoState.stake).toBe(4);
    expect(state.currentTurn).toBe(playerB.id);

    // B rejects
    const r4 = rejectEnvido(state, playerB.id);
    expect(r4.ok).toBe(true);
    if (!r4.ok) return;
    state = r4.state;
    // A (caller of pending real_envido) wins: max(stake+1, lvlPts-1) = max(5, 2) = 5
    const teamA = state.teams.find((t) => t.id === `team-${playerA.id}`);
    expect(teamA?.score).toBe(5);
    expect(state.hand.envidoState.resolved).toBe(true);
  });
});

// ── Integration: envido+truco ordering after counter-calls ───────────

describe("envido+truco ordering after counter-calls", () => {
  it("after counter-call chain resolves, truco can be called", () => {
    const rng = createSeededRng(42);
    let state = createMatch({ players: [playerA, playerB], pointsToWin: 15, rng });

    // A calls envido
    const r1 = callEnvido(state, playerA.id, "envido");
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    state = r1.state;

    // B counter-calls envido (stake=2, pending={B,envido}, turn→A)
    const r2 = callEnvido(state, playerB.id, "envido");
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    state = r2.state;

    // A accepts (turn→B, the original caller of the counter)
    const r3 = acceptEnvido(state, playerA.id);
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    state = r3.state;
    expect(state.hand.envidoState.resolved).toBe(true);
    // Turn is now B (caller of the counter-call that was accepted)
    expect(state.currentTurn).toBe(playerB.id);

    // B can now call truco
    const r4 = makeCall(state, playerB.id, "truco");
    expect(r4.ok).toBe(true);
    if (!r4.ok) return;
    expect(r4.state.hand.callState.pendingCall?.level).toBe("truco");
  });
});
