import { nextRoundLeader, startHandRoles } from "@/domain/game";
import type { Player } from "@/domain/game";

const playerA: Player = { id: "player-a", name: "Alice" };
const playerB: Player = { id: "player-b", name: "Bob" };
const players: readonly [Player, Player] = [playerA, playerB];

describe("startHandRoles", () => {
  it("hand 1: dealer = players[1], mano = players[0]", () => {
    const roles = startHandRoles(1, players);
    expect(roles.dealer).toBe(playerB.id);
    expect(roles.mano).toBe(playerA.id);
  });

  it("hand 2: dealer = players[0], mano = players[1]", () => {
    const roles = startHandRoles(2, players);
    expect(roles.dealer).toBe(playerA.id);
    expect(roles.mano).toBe(playerB.id);
  });

  it("hand 3: dealer = players[1], mano = players[0]", () => {
    const roles = startHandRoles(3, players);
    expect(roles.dealer).toBe(playerB.id);
    expect(roles.mano).toBe(playerA.id);
  });

  it("hand 4: dealer = players[0], mano = players[1]", () => {
    const roles = startHandRoles(4, players);
    expect(roles.dealer).toBe(playerA.id);
    expect(roles.mano).toBe(playerB.id);
  });
});

describe("nextRoundLeader", () => {
  it("trick winner leads next round", () => {
    expect(nextRoundLeader(playerA.id, playerB.id)).toBe(playerA.id);
    expect(nextRoundLeader(playerB.id, playerA.id)).toBe(playerB.id);
  });

  it("tie restores mano leadership", () => {
    expect(nextRoundLeader("tie", playerA.id)).toBe(playerA.id);
    expect(nextRoundLeader("tie", playerB.id)).toBe(playerB.id);
  });
});
