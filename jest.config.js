/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  moduleNameMapper: {
    // Specific mappings first
    "^@/lib/firebase$": "<rootDir>/__mocks__/lib-firebase.ts",
    "^expo-constants$": "<rootDir>/__mocks__/expo-constants.js",
    "^expo(.*)$": "<rootDir>/__mocks__/expo-stub.js",
    "^firebase/(.*)$": "<rootDir>/__mocks__/firebase-stub.js",
    "^react-native$": "<rootDir>/__mocks__/expo-stub.js",
    // Fallback path alias
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.json",
      isolatedModules: true,
    },
  },
};
