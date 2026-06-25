import { type ReactNode, createContext, useContext } from "react";

import { type Theme, theme } from "./tokens";

const ThemeContext = createContext<Theme>(theme);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
