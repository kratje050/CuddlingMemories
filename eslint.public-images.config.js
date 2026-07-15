import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

const commonRules = {
  "no-undef": "error",
  "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
};

export default [
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2023 },
    },
    plugins: { react },
    rules: { ...commonRules, "react/jsx-uses-vars": "error" },
  },
  {
    files: ["netlify/functions/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { sourceType: "module", ecmaVersion: "latest" },
      globals: { ...globals.node, ...globals.es2023, fetch: "readonly", Request: "readonly", Response: "readonly", URL: "readonly" },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      ...commonRules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
