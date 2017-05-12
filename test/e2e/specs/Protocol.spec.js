import utils from '../utils';

describe('Custom Protocol', function () {
  utils.beforeAll(this);

  it('has lulumi: protocol', function () {
    return this.app.client.waitForBrowserWindow()
      .tabByIndex(0)
      .loadUrl('lulumi://about/#/')
      .waitForVisible('#app')
      .getUrl()
      .then((url) => {
        expect(url).to.equal('lulumi://about/#/');
      });
  });
});
