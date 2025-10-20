import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/test/**",
      "test/**",
      "scripts/**",
      "vitest.config.ts",
    ],
  },
  // Project overrides: keep linting on, but avoid blocking builds on common patterns
  {
    rules: {
      // Allow pragmatic use of any during rapid iteration; still visible as warnings if needed
      "@typescript-eslint/no-explicit-any": "warn",
      // Don't fail builds for unused vars; surface as warnings and allow _-prefixed ignores
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }
      ],
    },
  },
];

export default eslintConfig;
