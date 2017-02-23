import utils from '../utils';

describe('Launch', function () {
  beforeEach(utils.beforeEach);
  afterEach(utils.afterEach);

  it('has two windows. One main window and one default webview page', function () {
    return this.app.client.getWindowCount()
      .then((count) => {
        expect(count).to.equal(2);
      });
  });

  it('has everything set up', function () {
    return this.app.client.waitUntilWindowLoaded()
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
