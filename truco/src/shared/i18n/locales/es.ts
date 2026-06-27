export const es = {
  app: {
    name: "Truco Lab",
    tagline: "Aprendé y jugá al truco argentino",
  },
  menu: {
    play: "Jugar",
    rules: "Reglas",
    ranking: "Jerarquía de cartas",
    settings: "Ajustes",
    about: "Acerca de",
  },
  screens: {
    game: "Mesa de juego",
    game_setup: "Nueva partida",
    rules: "Reglas y tutorial",
    ranking: "Jerarquía de cartas",
    result: "Resultado",
    settings: "Ajustes",
    about: "Acerca de",
    placeholder: "Pantalla en construcción",
  },
  game: {
    turn: {
      player: "Tu turno",
      opponent: "{{name}} está jugando",
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
      mazo: "Me voy al mazo",
    },
  },
  settings: {
    language: "Idioma",
    spanish: "Español",
    english: "English",
  },
  common: {
    back: "Volver",
  },
  about: {
    description:
      "Truco Lab es un entrenador de Truco argentino construido con React Native Web para demostrar modelado de dominio, UI cross-platform y reglas testeables.",
  },
} as const;
