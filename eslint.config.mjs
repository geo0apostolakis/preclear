import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Mount-time setState is the correct pattern in three places here:
      // reading localStorage after hydration (StoreProvider), feature-detecting
      // window.ethereum (lib/wallet), and the WebGL canvas mount guard in
      // components/ui/animated-gradient. Kept as a warning so new instances
      // still show up rather than being silently allowed.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
