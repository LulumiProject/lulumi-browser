// require all test files (files that ends with .spec.js)
const testsContext = require.context('./specs/renderer', true, /\.spec$/)
testsContext.keys().forEach(testsContext)

// require all src files except some files for coverage.
// you can also change this to match only the subset of files that
// you want coverage for.
const srcContext = require.context('../../src/renderer/mainBrowserWindow', true, /^\.\/(?!main|i18n|index(\.ts|\.ejs)?$)/)
srcContext.keys().forEach(srcContext)

// disable security warnings
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true
