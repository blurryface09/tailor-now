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
      // These two React Compiler rules cannot see through a promise boundary, so
      // they flag the ordinary "fetch on mount, then setState" pattern used by
      // every client page here. Each reported site was checked individually: the
      // setState calls all run after an await, inside a .then callback or an async
      // loader, never synchronously in the effect body — so none of them causes
      // the cascading renders the rule exists to prevent. react-hooks/purity
      // likewise flags Date.now() inside an event handler, which never runs during
      // render.
      //
      // Kept as warnings rather than switched off, so a genuine synchronous
      // setState in an effect is still reported. Clearing them for real means
      // moving data loading out of effects (server components, or a fetching
      // library that owns the cache) — a deliberate refactor, not a lint fix.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;
