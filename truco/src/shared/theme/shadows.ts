import { Platform, type ViewStyle } from "react-native";

export type ElevationLevel = 0 | 1 | 2 | 3;

const IOS_SHADOWS: Record<ElevationLevel, ViewStyle> = {
  0: {},
  1: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  2: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  3: {
    shadowColor: "#3e2723",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
};

const WEB_SHADOWS: Record<ElevationLevel, ViewStyle> = {
  0: {},
  1: { boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)" } as ViewStyle,
  2: { boxShadow: "0 4px 8px rgba(0, 0, 0, 0.25)" } as ViewStyle,
  3: { boxShadow: "0 8px 16px rgba(62, 39, 35, 0.3)" } as ViewStyle,
};

export function elevation(level: ElevationLevel): ViewStyle {
  if (level === 0) {
    return {};
  }

  if (Platform.OS === "android") {
    return { elevation: level };
  }

  if (Platform.OS === "web") {
    return WEB_SHADOWS[level];
  }

  return IOS_SHADOWS[level];
}

export type ThemeShadows = {
  elevation: typeof elevation;
};

export const shadows: ThemeShadows = { elevation };
