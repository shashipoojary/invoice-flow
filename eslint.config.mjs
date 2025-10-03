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
    ],
  },
  {
    rules: {
      // Allow unused variables in test files and API routes
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      // Allow any type in test files
      "@typescript-eslint/no-explicit-any": ["warn", { 
        "ignoreRestArgs": true 
      }],
      // Allow img elements in specific contexts
      "@next/next/no-img-element": "warn",
      // Allow missing dependencies in useEffect/useCallback for now
      "react-hooks/exhaustive-deps": "warn",
      // Allow missing alt attributes
      "jsx-a11y/alt-text": "warn"
    }
  }
];

export default eslintConfig;
