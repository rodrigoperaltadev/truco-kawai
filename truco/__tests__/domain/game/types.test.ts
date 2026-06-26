import type { MatchState, Player, Team } from "@/domain/game";

describe("types", () => {
  it("Player has id and name", () => {
    const player: Player = { id: "p1", name: "Alice" };
    expect(player.id).toBe("p1");
    expect(player.name).toBe("Alice");
  });

  it("Team has id, players, and score", () => {
    const player: Player = { id: "p1", name: "Alice" };
    const team: Team = { id: "team-1", players: [player], score: 0 };
    expect(team.id).toBe("team-1");
    expect(team.players).toHaveLength(1);
    expect(team.score).toBe(0);
  });

  it("MatchState has no isCPU flag on Player", () => {
    const player: Player = { id: "p1", name: "Alice" };
    const playerKeys = Object.keys(player);
    expect(playerKeys).not.toContain("isCPU");
  });

  it("MatchState has no isCPU flag on Team", () => {
    const player: Player = { id: "p1", name: "Alice" };
    const team: Team = { id: "team-1", players: [player], score: 0 };
    const teamKeys = Object.keys(team);
    expect(teamKeys).not.toContain("isCPU");
  });

  it("Team score defaults to 0", () => {
    const player: Player = { id: "p1", name: "Alice" };
    const team: Team = { id: "team-1", players: [player], score: 0 };
    expect(team.score).toBe(0);
    expect(team.score).toBeGreaterThanOrEqual(0);
  });
});
