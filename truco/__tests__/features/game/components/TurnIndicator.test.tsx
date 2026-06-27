import { TurnIndicator } from "@/features/game/components/TurnIndicator";
import { render } from "../../../helpers/render";

describe("TurnIndicator", () => {
  it("shows player turn text", async () => {
    const { findByText } = render(<TurnIndicator turnLabel={{ kind: "player" }} testID="turn" />);

    expect(await findByText("Tu turno")).toBeTruthy();
  });

  it("shows opponent name when it is the opponent's turn", async () => {
    const { findByText } = render(
      <TurnIndicator turnLabel={{ kind: "opponent", name: "Bob" }} testID="turn" />,
    );

    expect(await findByText("Bob está jugando")).toBeTruthy();
  });
});
