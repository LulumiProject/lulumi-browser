import test from 'ava';
import utils from './utils';

utils.beforeEach(test);

// Require all JS files in `./specs` for Mocha to consume
require('require-dir')('./specs');
