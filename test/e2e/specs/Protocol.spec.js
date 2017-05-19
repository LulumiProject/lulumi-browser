import test from 'ava';
import { keys } from '../utils';

const urlInput = '#url-input';

test('has working about: handlers for redirecting requests to lulumi: protocol', async (t) => {
  const app = t.context.app;
  await app.client
    .waitForVisible(urlInput)
    .click(urlInput)
    .keys('about:lulumi')
    .keys(keys.ENTER);

  expect(await app.client
    .tabByIndex(0)
    .waitForVisible('#app')
    .getUrl()).to.equal('lulumi://about/#/lulumi');
});
