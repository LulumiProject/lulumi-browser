import test from 'ava';

test('has accessible lulumi: protocol', async (t) => {
  const app = t.context.app;
  await app.client.waitForBrowserWindow();

  expect(await app.client
    .tabByIndex(0)
    .loadUrl('lulumi://about/#/')
    .waitForVisible('#app')
    .getUrl()).to.equal('lulumi://about/#/');
});
