import type { Suit, SuitMeta } from "./types";

export const SUIT_ORDER = ["espada", "basto", "copa", "oro"] as const;

export const SUITS: Readonly<Record<Suit, SuitMeta>> = {
  espada: { label: "Espada", accentColor: "#7B8FA1" },
  basto: { label: "Basto", accentColor: "#5A7A4A" },
  copa: { label: "Copa", accentColor: "#A0522D" },
  oro: { label: "Oro", accentColor: "#C8972A" },
};
