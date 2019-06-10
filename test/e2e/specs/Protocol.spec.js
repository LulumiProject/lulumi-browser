import test from 'ava';
import { keys } from '../utils';

const urlInput = '#url-input';

test.serial('has working about: handlers for redirecting requests to lulumi: protocol', async (t) => {
  const app = t.context.app;
  const el = await app.client
    .waitForVisible(urlInput)
    .click(urlInput)
    .elementActive();

  await app.client
    .elementIdValue(el.value.ELEMENT, 'about:newtab')
    .elementIdValue(el.value.ELEMENT, keys.ENTER);

  expect(await app.client
    .tabByIndex(1) // tabByIndex(0) is command-palatte page
    .waitForVisible('#app')
    .elementActive()
    .getUrl()).to.equal('lulumi://about/#/newtab');
});
