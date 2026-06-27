import { fireEvent } from "@testing-library/react-native";

import type { Card } from "@/domain/deck";
import { PlayerHandZone } from "@/features/game/components/PlayerHandZone";
import { render } from "../../../helpers/render";

const TEST_CARDS: Card[] = [
  { rank: 7, suit: "espada" },
  { rank: 1, suit: "basto" },
  { rank: 12, suit: "oro" },
];

describe("PlayerHandZone", () => {
  it("renders exactly 3 cards", async () => {
    const { findAllByRole } = render(
      <PlayerHandZone cards={TEST_CARDS} enabled onPlay={jest.fn()} testID="hand" />,
    );

    expect(await findAllByRole("button")).toHaveLength(3);
  });

  it("renders card labels using jargon", async () => {
    const { findByText } = render(<PlayerHandZone cards={TEST_CARDS} enabled onPlay={jest.fn()} />);

    expect(await findByText("7 Espada")).toBeTruthy();
    expect(await findByText("1 Basto")).toBeTruthy();
    expect(await findByText("12 Oro")).toBeTruthy();
  });

  it("calls onPlay with the correct card when tapped", async () => {
    const onPlay = jest.fn();
    const { findByTestId } = render(
      <PlayerHandZone cards={TEST_CARDS} enabled onPlay={onPlay} testID="hand" />,
    );

    fireEvent.press(await findByTestId("hand-card-1"));

    expect(onPlay).toHaveBeenCalledWith(TEST_CARDS[1]);
  });

  it("does not call onPlay when disabled", async () => {
    const onPlay = jest.fn();
    const { findByTestId } = render(
      <PlayerHandZone cards={TEST_CARDS} enabled={false} onPlay={onPlay} testID="hand" />,
    );

    fireEvent.press(await findByTestId("hand-card-0"));

    expect(onPlay).not.toHaveBeenCalled();
  });

  it("sets accessibilityState.disabled when not enabled", async () => {
    const { findAllByRole } = render(
      <PlayerHandZone cards={TEST_CARDS} enabled={false} onPlay={jest.fn()} />,
    );

    const disabledButtons = await findAllByRole("button", { disabled: true });
    expect(disabledButtons).toHaveLength(3);
  });
});
