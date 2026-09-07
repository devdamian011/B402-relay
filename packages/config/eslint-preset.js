/** Shared ESLint preset extended by every app/package. */
module.exports = {
  root: true,
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: { es2022: true, node: true },
  ignorePatterns: ["dist/**", ".next/**", "node_modules/**"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": ["warn", { allow: ["warn", "error"] }]
  }
};
