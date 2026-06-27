jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock expo-localization to return a consistent locale for tests
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "es" }],
}));
