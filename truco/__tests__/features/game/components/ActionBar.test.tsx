import { fireEvent } from "@testing-library/react-native";

import { ActionBar } from "@/features/game/components/ActionBar";
import type { GameActions, GameHandlers } from "@/features/game/hooks/useGameState";
import { render } from "../../../helpers/render";

function allFalseActions(): GameActions {
  return {
    truco: false,
    retruco: false,
    valeCuatro: false,
    envido: false,
    realEnvido: false,
    faltaEnvido: false,
    quiero: false,
    noQuiero: false,
    mazo: false,
  };
}

function stubHandlers(): GameHandlers {
  return {
    onPlayCard: jest.fn(),
    onCall: jest.fn(),
    onCallEnvido: jest.fn(),
    onAccept: jest.fn(),
    onReject: jest.fn(),
    onMazo: jest.fn(),
  };
}

describe("ActionBar", () => {
  it("renders nothing when no actions are enabled", () => {
    const { toJSON } = render(
      <ActionBar actions={allFalseActions()} handlers={stubHandlers()} testID="action-bar" />,
    );

    expect(toJSON()).toBeNull();
  });

  it("renders only enabled action buttons", async () => {
    const actions: GameActions = {
      ...allFalseActions(),
      truco: true,
      mazo: true,
    };
    const handlers = stubHandlers();

    const { findByText, queryByText } = render(
      <ActionBar actions={actions} handlers={handlers} testID="action-bar" />,
    );

    expect(await findByText("Truco")).toBeTruthy();
    expect(await findByText("Me voy al mazo")).toBeTruthy();
    // queryByText doesn't wait, so these should be null immediately
    expect(queryByText("Quiero")).toBeNull();
    expect(queryByText("No Quiero")).toBeNull();
    expect(queryByText("Envido")).toBeNull();
  });

  it("calls the correct handler when a button is pressed", async () => {
    const actions: GameActions = {
      ...allFalseActions(),
      truco: true,
    };
    const handlers = stubHandlers();

    const { findByText } = render(
      <ActionBar actions={actions} handlers={handlers} testID="action-bar" />,
    );

    fireEvent.press(await findByText("Truco"));

    expect(handlers.onCall).toHaveBeenCalledWith("truco");
  });

  it("calls onAccept when Quiero is pressed", async () => {
    const actions: GameActions = {
      ...allFalseActions(),
      quiero: true,
    };
    const handlers = stubHandlers();

    const { findByText } = render(<ActionBar actions={actions} handlers={handlers} />);

    fireEvent.press(await findByText("Quiero"));

    expect(handlers.onAccept).toHaveBeenCalled();
  });

  it("calls onMazo when fold button is pressed", async () => {
    const actions: GameActions = {
      ...allFalseActions(),
      mazo: true,
    };
    const handlers = stubHandlers();

    const { findByText } = render(<ActionBar actions={actions} handlers={handlers} />);

    fireEvent.press(await findByText("Me voy al mazo"));

    expect(handlers.onMazo).toHaveBeenCalled();
  });
});
