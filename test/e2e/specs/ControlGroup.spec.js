import test from 'ava';
import { keys } from '../utils';

const urlInput = '#url-input';
const controlGroup = '.control-group';

test.serial('has the functional control group', async (t) => {
  const app = t.context.app;
  const el = await app.client
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
    .click(urlInput)
    .elementActive();

  await app.client
  .elementIdValue(el.value.ELEMENT, 'https://example.com/')
  .elementIdValue(el.value.ELEMENT, keys.ENTER);

  await app.client
    .waitForUrl('https://example.com/')
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
    .waitForExist(controlGroup);

  expect(await app.client.waitForExist('#browser-navbar__refresh.enabled')).to.equal(true);

  await app.client
    .waitForUrl('https://example.com/')
    .loadUrl('lulumi://about/#/lulumi')
    .waitForBrowserWindow();

  expect(await app.client
    .waitForExist('#browser-navbar__goBack.enabled')).to.equal(true);
  expect(await app.client
    .waitForExist('#browser-navbar__goForward.disabled')).to.equal(true);

  await app.client
    .waitForExist('#browser-navbar__goBack.enabled')
    .click('#browser-navbar__goBack.enabled');

  expect(await app.client
    .waitForExist('#browser-navbar__goBack.enabled')).to.equal(true);
  expect(await app.client
    .waitForExist('#browser-navbar__goForward.enabled')).to.equal(true);
});
