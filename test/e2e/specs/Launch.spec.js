import test from 'ava';

test('has everything set up', async (t) => {
  const app = t.context.app;
  await app.client.waitForBrowserWindow();

  const win = app.browserWindow;
  expect(await app.client.getWindowCount()).to.equal(1);
  expect(await win.isMinimized()).to.equal(false);
  expect(await win.isDevToolsOpened()).to.equal(false);
  expect(await win.isVisible()).to.equal(true);

  const { width, height } = await win.getBounds();
  expect(width).to.above(0);
  expect(height).to.above(0);
});
