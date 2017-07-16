import test from 'ava';
import { keys } from '../utils';

const urlInput = '#url-input';

test('has working about: handlers for redirecting requests to lulumi: protocol', async (t) => {
  const app = t.context.app;
  const result = await app.client
    .waitForVisible(urlInput)
    .click(urlInput)
    .elementActive();
  const activeElement = result.value && result.value.ELEMENT;
  if(activeElement) {
    await app.client
      .elementIdValue(activeElement, 'about:lulumi')
      .elementIdValue(activeElement, keys.ENTER);
  }

  expect(await app.client
    .tabByIndex(0)
    .waitForVisible('#app')
    .getUrl()).to.equal('lulumi://about/#/lulumi');
});
