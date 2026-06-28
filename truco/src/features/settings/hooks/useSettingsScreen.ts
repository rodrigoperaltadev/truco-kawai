import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import { type Locale, useI18n } from "@/shared/i18n";

const MUSIC_VOLUME_KEY = "@truco/music-volume";
const VOICE_VOLUME_KEY = "@truco/voice-volume";
const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  // Snap to nearest step
  let best: number = VOLUME_STEPS[0];
  let bestDist = Math.abs(value - best);
  for (const step of VOLUME_STEPS) {
    const dist = Math.abs(value - step);
    if (dist < bestDist) {
      best = step;
      bestDist = dist;
    }
  }
  return best;
}

export function useSettingsScreen() {
  const { locale, setLocale, t } = useI18n();

  const [musicVolume, setMusicVolumeState] = useState(0.75);
  const [voiceVolume, setVoiceVolumeState] = useState(0.75);

  // Load persisted volumes on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [musicRaw, voiceRaw] = await Promise.all([
          AsyncStorage.getItem(MUSIC_VOLUME_KEY),
          AsyncStorage.getItem(VOICE_VOLUME_KEY),
        ]);
        if (cancelled) return;
        if (musicRaw !== null) {
          const parsed = Number.parseFloat(musicRaw);
          setMusicVolumeState(clampVolume(parsed));
        }
        if (voiceRaw !== null) {
          const parsed = Number.parseFloat(voiceRaw);
          setVoiceVolumeState(clampVolume(parsed));
        }
      } catch {
        // Storage failure → keep defaults
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMusicVolume = useCallback((value: number) => {
    const clamped = clampVolume(value);
    setMusicVolumeState(clamped);
    AsyncStorage.setItem(MUSIC_VOLUME_KEY, String(clamped)).catch(() => {});
  }, []);

  const setVoiceVolume = useCallback((value: number) => {
    const clamped = clampVolume(value);
    setVoiceVolumeState(clamped);
    AsyncStorage.setItem(VOICE_VOLUME_KEY, String(clamped)).catch(() => {});
  }, []);

  const translations = useMemo(
    () => ({
      title: t("screens.settings"),
      language: t("settings.language"),
      spanish: t("settings.spanish"),
      english: t("settings.english"),
      musicVolume: t("settings.music_volume"),
      voiceVolume: t("settings.voice_volume"),
    }),
    [t],
  );

  const selectLocale = async (nextLocale: Locale) => {
    await setLocale(nextLocale);
  };

  return {
    locale,
    translations,
    selectLocale,
    musicVolume,
    voiceVolume,
    setMusicVolume,
    setVoiceVolume,
    volumeSteps: VOLUME_STEPS as readonly number[],
  };
}
