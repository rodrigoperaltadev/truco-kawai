// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

import { GameScreen } from "@/features/game/GameScreen";
import { render } from "../../helpers/render";

describe("GameScreen", () => {
  it("renders all six zones", async () => {
    const { findByTestId } = render(<GameScreen />);

    expect(await findByTestId("score-header")).toBeTruthy();
    expect(await findByTestId("opponent-zone")).toBeTruthy();
    expect(await findByTestId("table-zone")).toBeTruthy();
    expect(await findByTestId("action-bar")).toBeTruthy();
    expect(await findByTestId("player-hand")).toBeTruthy();
    expect(await findByTestId("event-log")).toBeTruthy();
  });

  it("does not render PlaceholderScreen", async () => {
    const { queryByTestId } = render(<GameScreen />);

    expect(queryByTestId("placeholder-screen")).toBeNull();
  });

  it("renders the game screen container", async () => {
    const { findByTestId } = render(<GameScreen />);

    expect(await findByTestId("game-screen")).toBeTruthy();
  });
});
