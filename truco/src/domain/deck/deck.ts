import { RANKS } from "./ranks";
import { SUIT_ORDER } from "./suits";
import type { Card } from "./types";

export type DealInput = {
  deck: Card[];
  handSize: number;
  playerCount?: number;
};

export type DealResult = {
  hands: Card[][];
  remaining: Card[];
};

const DEFAULT_PLAYER_COUNT = 2;

export function createDeck(): ReadonlyArray<Card> {
  const deck: Card[] = [];
  for (const suit of SUIT_ORDER) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffle(deck: ReadonlyArray<Card>, rng: () => number = Math.random): Card[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    const swap = copy[j];
    if (tmp !== undefined && swap !== undefined) {
      copy[i] = swap;
      copy[j] = tmp;
    }
  }
  return copy;
}

export function deal(input: DealInput): DealResult {
  const { deck, handSize, playerCount = DEFAULT_PLAYER_COUNT } = input;
  const required = handSize * playerCount;

  if (deck.length < required) {
    throw new RangeError(`Deck has ${deck.length} cards but deal requires ${required}`);
  }

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let cursor = 0;

  for (let round = 0; round < handSize; round++) {
    for (let player = 0; player < playerCount; player++) {
      const hand = hands[player];
      const card = deck[cursor];
      if (hand !== undefined && card !== undefined) {
        hand.push(card);
      }
      cursor++;
    }
  }

  return { hands, remaining: deck.slice(cursor) };
}
