import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
export default defineConfig([
  ...nextCoreWebVitals,
  {
    files: ["src/**/*.{ts,tsx}"],
    // These new React Compiler checks surface existing state-sync patterns.
    // Keep them visible while migrating the framework without rewriting UI state.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);
