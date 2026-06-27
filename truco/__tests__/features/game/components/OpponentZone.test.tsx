import { OpponentZone } from "@/features/game/components/OpponentZone";
import { render } from "../../../helpers/render";

describe("OpponentZone", () => {
  it("renders the opponent name", async () => {
    const { findByText } = render(
      <OpponentZone
        name="Bob"
        cardCount={3}
        isActive={false}
        turnLabel={{ kind: "player" }}
        testID="opponent"
      />,
    );

    expect(await findByText("Bob")).toBeTruthy();
  });

  it("renders the correct number of card backs", async () => {
    const { findAllByLabelText } = render(
      <OpponentZone
        name="Bob"
        cardCount={3}
        isActive={false}
        turnLabel={{ kind: "player" }}
        testID="opponent"
      />,
    );

    expect(await findAllByLabelText("Carta boca abajo")).toHaveLength(3);
  });

  it("renders 2 card backs when cardCount is 2", async () => {
    const { findAllByLabelText } = render(
      <OpponentZone
        name="Bob"
        cardCount={2}
        isActive={false}
        turnLabel={{ kind: "player" }}
        testID="opponent"
      />,
    );

    expect(await findAllByLabelText("Carta boca abajo")).toHaveLength(2);
  });

  it("shows TurnIndicator when isActive is true", async () => {
    const { findByText } = render(
      <OpponentZone
        name="Bob"
        cardCount={3}
        isActive={true}
        turnLabel={{ kind: "opponent", name: "Bob" }}
        testID="opponent"
      />,
    );

    expect(await findByText("Bob está jugando")).toBeTruthy();
  });

  it("does not show TurnIndicator when isActive is false", async () => {
    const { queryByText, findByText } = render(
      <OpponentZone
        name="Bob"
        cardCount={3}
        isActive={false}
        turnLabel={{ kind: "player" }}
        testID="opponent"
      />,
    );

    // Wait for I18nProvider to initialize, then check
    // "Tu turno" won't appear because isActive is false
    // We need to wait for the provider to be ready before asserting null
    await findByText("Bob"); // Wait for component to render
    expect(queryByText("Tu turno")).toBeNull();
  });
});
