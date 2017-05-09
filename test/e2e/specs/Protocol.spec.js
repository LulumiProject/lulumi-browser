import utils from '../utils';

describe('Protocol', function () {
  beforeEach(utils.beforeEach);
  afterEach(utils.afterEach);

  it('has lulumi: and lulumi-extension: protocols', function () {
    return this.app.client.waitForUrl('lulumi://about/#/')
      .waitForBrowserWindow()
      .getText('#about-name')
      .then((text) => {
        expect(text).to.equal('About Page');
      });
  });
});
