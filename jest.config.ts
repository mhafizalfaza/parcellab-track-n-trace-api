import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
};
export default config;
