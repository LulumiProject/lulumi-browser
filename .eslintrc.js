module.exports = {
  root: true,
  parser: "babel-eslint",
  parserOptions: {
    sourceType: "module"
  },
  env: {
    browser: true,
    node: true
  },
  extends: "airbnb-base",
  globals: {
    __static: true
  },
  plugins: [
    "html"
  ],
  "rules": {
    "global-require": 0,
    "import/no-unresolved": 0,
    "no-param-reassign": 0,
    "no-shadow": 0,
    "import/extensions": 0,
    "no-prototype-builtins": 0,
    // allow debugger during development
    "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
    "import/no-extraneous-dependencies": 0,
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
    "linebreak-style": 0
  }
}
