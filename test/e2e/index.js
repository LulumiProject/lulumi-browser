'use strict'

// Set BABEL_ENV to use proper env config
process.env.BABEL_ENV = 'test';

// Set TEST_ENV to expose a `require` window global to Spectron,
// and ref: https://github.com/electron/spectron#node-integration
process.env.TEST_ENV = 'e2e';

// Attach Chai APIs to global scope
const { expect, should, assert } = require('chai');
global.expect = expect;
global.should = should;
global.assert = assert;

// Initilization
require('./init');
