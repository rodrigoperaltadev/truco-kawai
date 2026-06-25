import { useWindowDimensions } from "react-native";

import { type Breakpoint, resolveBreakpoint } from "./breakpoints";

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return resolveBreakpoint(width);
}
