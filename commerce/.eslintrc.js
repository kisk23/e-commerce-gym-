module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "@next/next/no-page-custom-font": "off",
    "@next/next/no-typos": "off",
    "@next/next/no-duplicate-head": "off",
    "react/no-unescaped-entities": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-var": "warn",
    "prefer-const": "warn",
    eqeqeq: ["warn", "always"],
    curly: ["warn", "all"],
    "no-debugger": "error",
    "no-trailing-spaces": "warn",
    "no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
}
