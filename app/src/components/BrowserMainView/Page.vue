<style scoped>
  #webviews {
    position: relative;
  }

  #webviews webview {
    margin-top: 60px;
    height: calc(100vh - 60px);
    width: 100vw;
    outline: none;
    position: absolute;
  }

  #webviews webview[hidden] {
	display: flex !important;
	visibility: hidden;
  }

  #webviews webview.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99;
  }

  /* hack to work around display: none issues with webviews */

  #webviews webview.hidden {
    visibility: hidden;
  }
</style>

<template lang="pug">
  #webviews
    webview#browser-page(src="https://www.github.com/qazbnm456/electron-vue-browser", autosize="on")
</template>

<script>
  export default {
    // When this component get mounted, register following handler for webview's 'dom-ready' event.
    mounted() {
      // navbar events initilization
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

      function createNewTab(url) {
        alert(url);
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
    },
  };
</script>
