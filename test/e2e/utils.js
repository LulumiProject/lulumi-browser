import electron from 'electron';
import { Application } from 'spectron';

const lululmiWindowUrl = 'file:///Users/boik/Documents/lulumi-browser/dist/index.html#/';

const promiseMapSeries = (array, iterator) => {
  var length = array.length;
  var current = Promise.resolve();
  var results = new Array(length);

  for (var i = 0; i < length; ++i) {
    current = results[i] = current.then(function (i) {
      return iterator(array[i]);
    }.bind(undefined, i));
  }
  return Promise.all(results);
};

function startApp() {
  this.app = new Application({
    path: electron,
    args: ['dist/main.js'],
    waitTimeout: 10000,
    waitInterval: 100
  });

  return this.app.start();
};

function stopApp() {
  this.timeout(10000);

  if (this.app && this.app.isRunning()) {
    return this.app.stop();
  }
};

function addCommands() {
  const app = this.app;
  const client = app.client;
  const initialized = [];

  const windowOrig = app.client.window;
  Object.getPrototypeOf(app.client).window = function (handle) {
    if (!initialized.includes(handle)) {
      initialized.push(handle);
      return windowOrig.apply(this, [handle]).call(() => {
        return app.api.initialize().then(() => true, () => true);
      }).then(() => windowOrig.apply(this, [handle]));
    } else {
      return windowOrig.apply(this, [handle]);
    }
  };

  const windowHandlesOrig = app.client.windowHandles;
  Object.getPrototypeOf(app.client).windowHandles = () => {
    return windowHandlesOrig.apply(this)
      .then((response) => {
        const handles = response.value;
        return promiseMapSeries(handles, (handle) => {
          return client.window(handle).getUrl().catch((err) => {
            console.error('Error retreiving window handle ' + handle, err);
            return '';
          });
        }).then((urls) => {
          const newHandles = []
          for (let i = 0; i < urls.length; i++) {
            if (urls[i].startsWith(lululmiWindowUrl)) {
              newHandles.push(handles[i]);
            }
          }
          response.value = newHandles;
          return response;
        });
      });
  }

  app.client.addCommand('tabHandles', () => {
    console.log('tabHandles()');
    return windowHandlesOrig.apply(client)
      .then((response) => {
        const handles = response.value;
        return promiseMapSeries(handles, (handle) => {
          return client.window(handle).getUrl().catch((err) => {
            console.error('Error retrieving window handle ' + handle, err);
            return '';
          });
        }).then((urls) => {
          const newHandles = [];
          for (let i = 0; i < urls.length; i++) {
            if (!(urls[i].startsWith('chrome-extension') || urls[i].startsWith('lulumi-extension')
              || urls[i].startsWith(lululmiWindowUrl))) {
              newHandles.push(handles[i]);
            }
          }
          response.value = newHandles;
          return response;
        });
      });
  });

  app.client.addCommand('tabByIndex', (index) => {
    console.log('tabByIndex(' + index + ')');
    return client.tabHandles().then((response) => response.value).then((handles) => {
      console.log('tabHandles() => handles.length = ' + handles.length + '; handles[' + index + '] = "' + handles[index] + '";');
      return client.window(handles[index]);
    });
  });

  app.client.addCommand('getTabCount', () => {
    console.log('getTabCount()');
    return client.tabHandles().then((response) => response.value).then((handles) => {
      console.log('getTabCount() => ' + handles.length);
      return handles.length;
    });
  });

  app.client.addCommand('waitForBrowserWindow', () => {
    console.log('waitForBrowserWindow()');
    return client.waitUntil(() => {
      return client.windowByUrl(lululmiWindowUrl).then((response) => {
        console.log('waitForBrowserWindow() => ' + JSON.stringify(response));
        return response;
      }, () => {
        console.log('waitForBrowserWindow() => false');
        return false;
      })
    }, 500, null, 100);
  });

  app.client.addCommand('windowByUrl', (url) => {
    console.log('windowByUrl("' + url + '")');
    return client.windowHandles().then((response) => response.value).then((handles) => {
      return promiseMapSeries(handles, (handle) => {
        return client.window(handle).getUrl();
      }).then((response) => {
        console.log('windowByUrl("' + url + '") => ' + JSON.stringify(response));
        const index = response.indexOf(url);
        if (index !== -1) {
          return client.window(handles[index]);
        } else {
          return undefined;
        }
      });
    });
  });

  app.client.addCommand('loadUrl', (url) => {
    console.log('loadUrl("' + url + '")');

    return client.url(url).then((response) => {
      console.log('loadUrl.url() => ' + JSON.stringify(response));
    }, (error) => {
      console.log('loadUrl.url() => ERROR: ' + JSON.stringify(error));
    }).waitForUrl(url);
  });

  app.client.addCommand('waitForUrl', (url) => {
    console.log('waitForUrl("' + url + '")');
    return client.waitUntil(() => {
      return client.tabByUrl(url).then((response) => {
        console.log('tabByUrl("' + url + '") => ' + JSON.stringify(response));
        return response;
      }, () => {
        console.log('tabByUrl("' + url + '") => false');
        return false;
      });
    }, 5000, null, 100);
  });

  app.client.addCommand('tabByUrl', (url) => {
    console.log('tabByUrl("' + url + '")');
    return client.tabHandles().then((response) => response.value).then((handles) => {
      return promiseMapSeries(handles, (handle) => {
        return client.window(handle).getUrl();
      }).then((response) => {
        const index = response.indexOf(url);
        if (index !== -1) {
          return client.window(handles[index]);
        } else {
          return undefined;
        }
      });
    });
  });
};

export default {
  beforeAll(context) {
    context.timeout(30000)

    context.beforeAll(function () {
      return startApp.call(this);
    });

    context.beforeAll(function () {
      addCommands.call(this);
    });

    context.afterAll(function () {
      return stopApp.call(this);
    });
  },
  beforeEach(context) {
    context.timeout(30000)

    context.beforeEach(function () {
      return startApp.call(this);
    });

    context.beforeEach(function () {
      addCommands.call(this);
    });

    context.afterEach(function () {
      return stopApp.call(this);
    });
  },
}
