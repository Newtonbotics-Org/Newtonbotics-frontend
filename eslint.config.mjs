import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Use a serializable config that Next.js can handle during builds
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", ".vercel/**"],
  },
// Explicitly cover .jsx files that are ignored by next/core-web-vitals by default
  ...compat.extends("next/core-web-vitals").map((config) => ({
    ...config,
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
  })),
];

export default eslintConfig;
