import electron from 'electron';
import path from 'path';
import { Application } from 'spectron';

const lulumiWindowUrl = `file://${path.resolve(__dirname, '../../')}/dist/index.html#/`;

const logVerboseEnabled = process.env.LULUMI_TEST_VERBOSE;
const logVerbose = (string, ...rest) => {
  if (logVerboseEnabled) {
    console.log(string, ...rest);
  }
};

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

const utils = {
  startApp: function () {
    this.app = new Application({
      path: electron,
      args: ['dist/main.js'],
      waitTimeout: 10000
    });
    return this.app.start();
  },

  stopApp: function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  },

  addCommands: function () {
    const app = this.app;
    const client = app.client;
    const initialized = [];

    const windowOrig = client.window;
    Object.getPrototypeOf(client).window = (handle) => {
      if (!initialized.includes(handle)) {
        initialized.push(handle);
        return windowOrig.apply(client, [handle]).call(() => {
          return app.api.initialize().then(() => true, () => true);
        }).then(() => windowOrig.apply(client, [handle]));
      } else {
        return windowOrig.apply(client, [handle]);
      }
    };

    const windowHandlesOrig = client.windowHandles;
    Object.getPrototypeOf(client).windowHandles = () => {
      return windowHandlesOrig.apply(client)
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
              if (urls[i].startsWith(lulumiWindowUrl)) {
                newHandles.push(handles[i]);
              }
            }
            response.value = newHandles;
            return response;
          });
        });
    };

    app.client.addCommand('tabHandles', () => {
      logVerbose('tabHandles()');
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
                || urls[i].startsWith(lulumiWindowUrl))) {
                newHandles.push(handles[i]);
              }
            }
            response.value = newHandles;
            return response;
          });
        });
    });

    app.client.addCommand('tabByIndex', (index) => {
      logVerbose('tabByIndex(' + index + ')');
      return client.tabHandles().then((response) => response.value).then((handles) => {
        logVerbose('tabHandles() => handles.length = ' + handles.length + '; handles[' + index + '] = "' + handles[index] + '";');
        return client.window(handles[index]);
      });
    });

    app.client.addCommand('getTabCount', () => {
      logVerbose('getTabCount()');
      return client.tabHandles().then((response) => response.value).then((handles) => {
        logVerbose('getTabCount() => ' + handles.length);
        return handles.length;
      });
    });

    app.client.addCommand('waitForBrowserWindow', () => {
      logVerbose('waitForBrowserWindow()');
      return client.waitUntil(() => {
        return client.windowByUrl(lulumiWindowUrl).then((response) => {
          logVerbose('waitForBrowserWindow() => ' + JSON.stringify(response));
          return response;
        }, () => {
          logVerbose('waitForBrowserWindow() => false');
          return false;
        })
      }, 5000, null, 100);
    });

    app.client.addCommand('windowParentByUrl', (url, childSelector='webview') => {
      logVerbose('windowParentByUrl("' + url + '", "' + childSelector + '")');
      return client.windowHandles().then((response) => response.value).then((handles) => {
        return promiseMapSeries(handles, (handle) => {
          return client.window(handle).getAttribute(childSelector, 'src').catch(() => '');
        });
      }).then((response) => {
        let index = response.indexOf(url);
        if (index !== -1) {
          return client.windowByIndex(index);
        } else {
          return undefined;
        }
      });
    });

    app.client.addCommand('windowByUrl', (url) => {
      logVerbose('windowByUrl("' + url + '")');
      return client.windowHandles().then((response) => response.value).then((handles) => {
        return promiseMapSeries(handles, (handle) => {
          return client.window(handle).getUrl();
        }).then((response) => {
          logVerbose('windowByUrl("' + url + '") => ' + JSON.stringify(response));
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
      logVerbose('loadUrl("' + url + '")');

      return client.url(url).then((response) => {
        logVerbose('loadUrl.url() => ' + JSON.stringify(response));
      }, (error) => {
        logVerbose('loadUrl.url() => ERROR: ' + JSON.stringify(error));
      }).waitForUrl(url);
    });

    app.client.addCommand('waitForUrl', (url) => {
      logVerbose('waitForUrl("' + url + '")');
      return client.waitUntil(() => {
        return client.tabByUrl(url).then((response) => {
          logVerbose('tabByUrl("' + url + '") => ' + JSON.stringify(response));
          return response;
        }, () => {
          logVerbose('tabByUrl("' + url + '") => false');
          return false;
        });
      }, 5000, null, 100);
    });

    app.client.addCommand('tabByUrl', (url) => {
      logVerbose('tabByUrl("' + url + '")');
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

    app.client.addCommand('waitForElementFocus', (selector, timeout) => {
      logVerbose('waitForElementFocus("' + selector + '", "' + timeout + '")');
      let activeElement;
      return client.waitForVisible(selector, timeout)
        .element(selector)
          .then((el) => { activeElement = el })
        .waitUntil(() => {
          return client.elementActive()
            .then((el) => {
              return el.value.ELEMENT === activeElement.value.ELEMENT;
            })
        }, timeout, null, 100);
    });

    app.client.addCommand('waitForInputText', (selector, input) => {
      logVerbose('waitForInputText("' + selector + '", "' + input + '")');
      return client
        .waitUntil(() => {
          return client.getValue(selector).then((val) => {
            let ret;
            if (input.constructor === RegExp) {
              ret = val && val.match(input);
            } else {
              ret = val === input;
            }
            logVerbose('Current val (in quotes): "' + val + '"');
            logVerbose('waitForInputText("' + selector + '", "' + input + '") => ' + ret);
            return ret;
          })
        }, 5000, null, 100);
    });

    app.client.addCommand('setInputText', (selector, input) => {
      logVerbose('setInputText("' + selector + '", "' + input + '")')
      return client
        .setValue(selector, input)
        .waitForInputText(selector, input);
    });
  },
};

export const keys = {
  COMMAND: '\ue03d',
  CONTROL: '\ue009',
  ESCAPE: '\ue00c',
  RETURN: '\ue006',
  ENTER: '\ue007',
  SHIFT: '\ue008',
  BACKSPACE: '\ue003',
  DELETE: '\ue017',
  LEFT: '\ue012',
  RIGHT: '\ue014',
  DOWN: '\ue015',
  UP: '\ue013',
  PAGEDOWN: '\uE00F',
  END: '\uE010',
  NULL: '\uE000'
};

export default utils;
