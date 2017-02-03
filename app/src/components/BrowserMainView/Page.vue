<style scoped>
  webview {
    height: calc(100vh - 62px);
    width: 100vw;
    outline: none;
    position: absolute;
  }

  webview[hidden] {
    display: flex !important;
    visibility: hidden;
  }

  webview.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99;
  }

  /* hack to work around display: none issues with webviews */

  webview.hidden {
    visibility: hidden;
  }
</style>

<template lang="pug">
  webview(ref="webview", src="https://github.com/qazbnm456/electron-vue-browser")
</template>

<script>
  export default {
    props: [
      'page',
      'currentPageIndex',
    ],
    methods: {
      webviewHandler(self, fnName) {
        return (event) => {
          if (self.$parent[fnName]) {
            self.$parent[fnName](event, this.page, this.currentPageIndex);
          }
        };
      },
    },
    mounted() {
      const webviewEvents = {
        'load-commit': 'onLoadCommit',
        'did-start-loading': 'onDidStartLoading',
        'did-stop-loading': 'onDidStopLoading',
        'did-finish-load': 'onDidFinishLoading',
        'did-fail-load': 'onDidFailLoad',
        'did-get-response-details': 'onDidGetResponseDetails',
        'did-get-redirect-request': 'onDidGetRedirectRequest',
        'dom-ready': 'onDomReady',
        'page-title-set': 'onPageTitleSet',
        'ipc-message': 'onIpcMessage',
        'console-message': 'onConsoleMessage',
      };

      Object.keys(webviewEvents).forEach((key) => {
        this.$refs.webview.addEventListener(key, this.webviewHandler(this, webviewEvents[key]));
      });

      // navbar events initilization
      /*
      const webview = document.getElementById('browser-page');
      const navbar = document.getElementById('browser-navbar');
      const tab = document.getElementById('tab-name');
      const urlInput = document.getElementById('url-input');

      webview.addEventListener('did-start-loading', () => {
        tab.innerHTML = 'Loading...';
      });

      webview.addEventListener('did-stop-loading', () => {
        if (tab.innerHTML === 'Loading...') {
          tab.innerHTML = webview.getTitle();
        }
      });

      webview.addEventListener('page-title-set', () => {
        tab.innerHTML = webview.getTitle();
        urlInput.value = webview.getURL();
        const controls = navbar.children[0].children;
        if (webview.canGoBack()) {
          controls[1].className = '';
        } else {
          controls[1].className = 'disabled';
        }
        if (webview.canGoForward()) {
          controls[2].className = '';
        } else {
          controls[2].className = 'disabled';
        }
      });

      function createPageObject(url) {
        return {
          location: url,
        };
      }

      function createNewTab(url) {
        createPageObject(url);
      }

      function createContextMenu(event, remote) {
        const { Menu, MenuItem } = remote;
        const menu = new Menu();

        if (event.params.linkURL) {
          menu.append(new MenuItem({
            label: 'Open Link in New Tab',
            click: () => {
              createNewTab(event.params.linkURL);
            },
          }));
        }

        menu.popup(remote.getCurrentWindow());
      }

      webview.addEventListener('context-menu', (event) => {
        const electron = require('electron');
        createContextMenu(event, electron.remote);
      });
      */
    },
  };
</script>
