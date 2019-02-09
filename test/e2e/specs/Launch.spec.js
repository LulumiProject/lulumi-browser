import test from 'ava';

test.serial('has everything set up', async (t) => {
  const app = t.context.app;
  const win = await app.client
    .waitUntilWindowLoaded()
    .browserWindow;

  expect(await win.isMinimized()).to.equal(false);
  expect(await win.isDevToolsOpened()).to.equal(false);
  expect(await win.isVisible()).to.equal(true);

  const { width, height } = await win.getBounds();
  expect(width).to.above(0);
  expect(height).to.above(0);

  expect(await app.client.getWindowCount()).to.equal(1);
});
