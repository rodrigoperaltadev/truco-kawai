export const en = {
  app: {
    name: "Truco Lab",
    tagline: "Learn and play Argentine Truco",
  },
  menu: {
    play: "Play",
    rules: "Rules",
    ranking: "Card ranking",
    settings: "Settings",
    about: "About",
  },
  screens: {
    game: "Game table",
    game_setup: "New game",
    rules: "Rules & tutorial",
    ranking: "Card ranking",
    result: "Match result",
    settings: "Settings",
    about: "About",
    placeholder: "Screen under construction",
  },
  game: {
    turn: {
      player: "Your turn",
      opponent: "{{name}} is playing",
    },
    actions: {
      truco: "Truco",
      retruco: "Re Truco",
      vale_cuatro: "Vale Cuatro",
      envido: "Envido",
      real_envido: "Real Envido",
      falta_envido: "Falta Envido",
      quiero: "Quiero",
      no_quiero: "No Quiero",
      mazo: "I fold",
    },
  },
  settings: {
    language: "Language",
    spanish: "Español",
    english: "English",
  },
  common: {
    back: "Back",
  },
  about: {
    description:
      "Truco Lab is an Argentine Truco trainer built with React Native Web to demonstrate domain modeling, cross-platform UI, and testable game rules.",
  },
} as const;
