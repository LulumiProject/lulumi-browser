import test from 'ava';
import { keys } from '../utils';

const urlInput = '#url-input';
const controlGroup = '.control-group';

test('enables back button', async (t) => {
  const app = t.context.app;
  await app.client
    .waitForUrl('https://github.com/qazbnm456/lulumi-browser')
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
    .waitForExist(controlGroup)
    .tabByIndex(0)
    .loadUrl('lulumi://about/#/lulumi')
    .waitForBrowserWindow();

  expect(await app.client
    .waitForExist('#browser-navbar__goBack.enabled')).to.equal(true);
  expect(await app.client
    .waitForExist('#browser-navbar__goForward.disabled')).to.equal(true);
});

test('enables forward button', async (t) => {
  const app = t.context.app;
  await app.client
    .waitForUrl('https://github.com/qazbnm456/lulumi-browser')
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
    .waitForExist(controlGroup)
    .tabByIndex(0)
    .loadUrl('lulumi://about/#/lulumi')
    .waitForBrowserWindow()
    .waitForExist('#browser-navbar__goBack.enabled')
    .click('#browser-navbar__goBack.enabled');

  expect(await app.client
    .waitForExist('#browser-navbar__goBack.disabled')).to.equal(true);
  expect(await app.client
    .waitForExist('#browser-navbar__goForward.enabled')).to.equal(true);
});

test('enables refresh', async (t) => {
  const app = t.context.app;

  expect(await app.client
    .waitForUrl('https://github.com/qazbnm456/lulumi-browser')
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
    .waitForExist(controlGroup)
    .waitForExist('#browser-navbar__refresh.enabled')).to.equal(true);
});
