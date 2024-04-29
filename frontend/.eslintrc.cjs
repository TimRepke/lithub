/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  ignorePatterns: ["src/util/filesaver.js", "src/util/nql/*", "src/views/ParseView.vue"],
  extends: [
    "plugin:vue/vue3-essential",
    "@vue/eslint-config-typescript/recommended",
    "@vue/eslint-config-prettier",
    // "plugin:vue/vue3-essential",
    // "eslint:recommended",
    // "@vue/eslint-config-typescript",
    // "@vue/eslint-config-airbnb-with-typescript",
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "no-mixed-operators": "error",
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "vue/max-len": [
      "error",
      {
        // maximum length of lines
        code: 140,
        ignorePattern: `'(d|style)="[^"]*"'`, // do this to ignore long lines for svg paths and long styles
        ignoreStrings: true,
        ignoreTrailingComments: true, // allow comments to be longer than max. line length
      },
    ],
    // "vuejs-accessibility/label-has-for": ["error", {
    //   required: {
    //     some: ["nesting", "id"],
    //   },
    //   allowChildren: false,
    // }],
    "object-curly-newline": "off",
    //   [
    //   "error",
    //   {
    //     ObjectPattern: "never",
    //   },
    // ],
    "class-methods-use-this": "off",
    "prefer-promise-reject-errors": "off",
    "vuejs-accessibility/click-events-have-key-events": "off",
    "vue/no-mutating-props": "off",
    "operator-linebreak": [
      "error",
      "after", // this is horrible, but prettier is refused to do before
      {
        overrides: {
          "?": "before",
          ":": "before",
        },
      },
    ],
    "consistent-return": [
      "error",
      {
        treatUndefinedAsUnspecified: false,
      },
    ],
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
