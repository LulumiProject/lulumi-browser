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
  webview(ref="webview", :class="isActive ? 'active' : 'hidden'")
</template>

<script>
  export default {
    props: [
      'isActive',
      'pageIndex',
    ],
    methods: {
      normalizedUri(input) {
        const prefix = 'http://';

        if (!/^([^:\/]+)(:\/\/)/g.test(input) && !prefix.includes(input)) {
          input = prefix + input;
        }

        return input;
      },
      navigateTo(location) {
        this.$refs.webview.src = this.normalizedUri(location || 'https://github.com/qazbnm456/electron-vue-browser');
      },
      webviewHandler(self, fnName) {
        return (event) => {
          if (self.$parent[fnName]) {
            self.$parent[fnName](event, this.pageIndex);
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

      this.$refs.webview.addEventListener('context-menu', (event) => {
        this.$parent.onWebviewContextMenu(event);
      });

      if (this.$store.getters.pages[this.pageIndex].location) {
        this.navigateTo(this.$store.getters.pages[this.pageIndex].location);
      }
    },
  };
</script>
