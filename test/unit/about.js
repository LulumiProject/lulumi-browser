// require all test files (files that ends with .spec.js)
const testsContext = require.context('./specs/about', true, /\.spec$/)
testsContext.keys().forEach(testsContext)

// require all src files except main.js for coverage.
// you can also change this to match only the subset of files that
// you want coverage for.
const srcGuestContext = require.context('../../src/guest/renderer', true, /^\.\/(?!main|i18n(\.ts)?$)/)
srcGuestContext.keys().forEach(srcGuestContext)
