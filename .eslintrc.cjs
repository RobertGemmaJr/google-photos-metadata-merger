module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "2021",
    sourceType: "module",
  },
  rules: {
    // TODO: Add runs for import order
  },
};
