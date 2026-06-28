import { useMemo } from "react";

import { createDeck, trucoRank } from "@/domain/deck";
import type { Card, Rank, Suit } from "@/domain/deck";
import { envidoCardValue } from "@/domain/game";
import { useTranslations } from "@/shared/i18n";
import { jargon } from "@/shared/i18n/jargon";

export type RankingRow = {
  position: number;
  suit: Suit;
  rank: Rank;
  suitLabel: string;
  rankLabel: string;
  envidoValue: number;
};

function rankLabel(rank: Rank): string {
  return jargon.ranks[rank] ?? String(rank);
}

function suitLabel(suit: Suit): string {
  return jargon.suits[suit] ?? suit;
}

export function useRankingScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("ranking.title"),
      position: t("ranking.hierarchy_position"),
      envidoValue: t("ranking.envido_value"),
    }),
    [t],
  );

  const cards: RankingRow[] = useMemo(() => {
    const deck: readonly Card[] = createDeck();
    const sorted = [...deck].sort((a, b) => trucoRank(a) - trucoRank(b));
    return sorted.map((card, index) => ({
      position: index + 1,
      suit: card.suit,
      rank: card.rank,
      suitLabel: suitLabel(card.suit),
      rankLabel: rankLabel(card.rank),
      envidoValue: envidoCardValue(card.rank),
    }));
  }, []);

  return { translations, cards };
}
