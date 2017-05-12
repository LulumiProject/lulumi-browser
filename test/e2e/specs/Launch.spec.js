import utils from '../utils';

describe('Launch', function () {
  utils.beforeAll(this);

  it('has everything set up', function () {
    return this.app.client.waitForBrowserWindow()
      .browserWindow.isMinimized()
        .then((min) => {
          expect(min).to.equal(false);
        })
      .browserWindow.isDevToolsOpened()
        .then((opened) => {
          expect(opened).to.equal(false);
        })
      .browserWindow.isVisible()
        .then((visible) => {
          expect(visible).to.equal(true);
        }).browserWindow.isFocused().then((focused) => {
          expect(focused).to.equal(true);
        }).browserWindow.getBounds().then((bounds) => {
          expect(bounds.width).to.above(0);
          expect(bounds.height).to.above(0);
        });
  });
});
