export default {
  files: [
    "test/e2e/index.js"
  ],
  concurrency: 5,
  failWithoutAssertions: false,
  require: [
    "@babel/register"
  ]
};
