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
      const webview = document.getElementById('browser-page');
      const navbar = document.getElementById('browser-navbar');
      const tab = document.getElementById('page-name');
      const urlInput = document.getElementById('url-input');
      webview.addEventListener('did-start-loading', () => {
        tab.innerHTML = 'Loading...';
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
    },
  };
</script>
