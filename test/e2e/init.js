import test from 'ava';
import utils from './utils';

test.beforeEach(async (t) => {
  await utils.startApp.call(t.context);
  utils.addCommands.call(t.context);
});

test.afterEach.always('cleanup', async (t) => {
  await utils.stopApp.call(t.context);
});

// Require all JS files in `./specs` for Mocha to consume
require('require-dir')('./specs');
