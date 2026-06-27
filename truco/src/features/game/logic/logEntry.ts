import type { Card } from "@/domain/deck";
import type { MatchState } from "@/domain/game/types";
import { jargon } from "@/shared/i18n/jargon";

// ── Types ───────────────────────────────────────────────────────────

export type LogEntryKind =
  | "play"
  | "trick"
  | "call"
  | "callResponse"
  | "envido"
  | "envidoResponse"
  | "fold";

export type LogEntry = Readonly<{
  id: string;
  kind: LogEntryKind;
  actorName: string;
  text: string;
}>;

/** Log entry without an assigned ID — the reducer assigns monotonic IDs. */
export type RawLogEntry = Readonly<{
  kind: LogEntryKind;
  actorName: string;
  text: string;
}>;

// ── Helpers ─────────────────────────────────────────────────────────

function cardLabel(card: Card): string {
  return `${card.rank} ${jargon.suits[card.suit]}`;
}

export function playerName(state: MatchState, playerId: string): string {
  const player = state.players.find((p) => p.id === playerId);
  return player?.name ?? playerId;
}

export function callLevelLabel(level: string): string {
  switch (level) {
    case "truco":
      return "Truco";
    case "retruco":
      return "Retruco";
    case "vale_cuatro":
      return "Vale Cuatro";
    default:
      return level;
  }
}

export function envidoLevelLabel(level: string): string {
  switch (level) {
    case "envido":
      return "Envido";
    case "real_envido":
      return "Real Envido";
    case "falta_envido":
      return "Falta Envido";
    default:
      return level;
  }
}

// ── Derivers ────────────────────────────────────────────────────────

/**
 * Derives log entries from a card play transition.
 * Compares prev vs next rounds to detect new cards and resolved tricks.
 */
export function derivePlayLogEntries(prevState: MatchState, nextState: MatchState): RawLogEntry[] {
  const entries: RawLogEntry[] = [];
  const prevRounds = prevState.hand.rounds;
  const nextRounds = nextState.hand.rounds;

  for (let i = 0; i < nextRounds.length; i++) {
    const nextRound = nextRounds[i];
    const prevRound = prevRounds[i];
    if (!nextRound) continue;

    const prevCards = prevRound?.trick.cardsPlayed ?? [];
    const nextCards = nextRound.trick.cardsPlayed;

    // New cards played in this round
    for (let j = prevCards.length; j < nextCards.length; j++) {
      const pc = nextCards[j];
      if (!pc) continue;
      const name = playerName(nextState, pc.playerId);
      entries.push({
        kind: "play",
        actorName: name,
        text: `${name}: ${cardLabel(pc.card)}`,
      });
    }

    // Trick resolution: flipped from unresolved to resolved
    if (nextRound.trick.resolved && (!prevRound || !prevRound.trick.resolved)) {
      const winner = nextRound.trick.winner;
      if (winner && winner !== "tie") {
        const name = playerName(nextState, winner);
        const winningPc = nextRound.trick.cardsPlayed.find((pc) => pc.playerId === winner);
        const text = winningPc
          ? `${name} ganó la baza con ${cardLabel(winningPc.card)}`
          : `${name} ganó la baza`;
        entries.push({ kind: "trick", actorName: name, text });
      } else if (winner === "tie") {
        entries.push({
          kind: "trick",
          actorName: "",
          text: "La baza fue empate",
        });
      }
    }
  }

  return entries;
}

/**
 * Derives log entries from call state history diff.
 * New entries with action "issued" → kind "call"; "accepted"/"rejected" → kind "callResponse".
 */
export function deriveCallLogEntries(prevState: MatchState, nextState: MatchState): RawLogEntry[] {
  const prevHistory = prevState.hand.callState.history;
  const nextHistory = nextState.hand.callState.history;
  const entries: RawLogEntry[] = [];

  for (let i = prevHistory.length; i < nextHistory.length; i++) {
    const entry = nextHistory[i];
    if (!entry) continue;
    const name = playerName(nextState, entry.caller);
    const kind: LogEntryKind = entry.action === "issued" ? "call" : "callResponse";
    const levelLabel = callLevelLabel(entry.level);

    let text: string;
    switch (entry.action) {
      case "issued":
        text = `${name} cantó ${levelLabel}`;
        break;
      case "accepted":
        text = `${name} quiso ${levelLabel}`;
        break;
      case "rejected":
        text = `${name} no quiso ${levelLabel}`;
        break;
    }
    entries.push({ kind, actorName: name, text });
  }

  return entries;
}

/**
 * Derives log entries from envido state history diff.
 * New entries with action "issued" → kind "envido"; "accepted"/"rejected" → kind "envidoResponse".
 */
export function deriveEnvidoLogEntries(
  prevState: MatchState,
  nextState: MatchState,
): RawLogEntry[] {
  const prevHistory = prevState.hand.envidoState.history;
  const nextHistory = nextState.hand.envidoState.history;
  const entries: RawLogEntry[] = [];

  for (let i = prevHistory.length; i < nextHistory.length; i++) {
    const entry = nextHistory[i];
    if (!entry) continue;
    const name = playerName(nextState, entry.actor);
    const kind: LogEntryKind = entry.action === "issued" ? "envido" : "envidoResponse";
    const levelLabel = envidoLevelLabel(entry.level);

    let text: string;
    switch (entry.action) {
      case "issued":
        text = `${name} cantó ${levelLabel}`;
        break;
      case "accepted":
        text = `${name} quiso ${levelLabel}`;
        break;
      case "rejected":
        text = `${name} no quiso ${levelLabel}`;
        break;
    }
    entries.push({ kind, actorName: name, text });
  }

  return entries;
}

/**
 * Builds a fold log entry directly (not diffed from state transition).
 * Used in the MAZO reducer case where fold has no domain history tail.
 */
export function foldLogEntry(folderId: string, prevState: MatchState): RawLogEntry {
  const name = playerName(prevState, folderId);
  return {
    kind: "fold",
    actorName: name,
    text: `${name} se fue al mazo`,
  };
}

/**
 * Assigns monotonic IDs to raw log entries starting from a given offset.
 */
export function assignIds(entries: readonly RawLogEntry[], offset: number): LogEntry[] {
  return entries.map((e, i) => ({
    ...e,
    id: String(offset + i),
  }));
}
