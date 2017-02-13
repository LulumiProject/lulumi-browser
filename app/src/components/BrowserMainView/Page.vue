<style scoped>
  webview {
    height: calc(100vh - 73px);
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

  #browser-page-status {
    background: #F3F3F3;
    border-color: #d3d3d3;
    border-style: solid;
    border-width: 1px 1px 0 0;
    border-top-right-radius: 4px;
    bottom: 0;
    color: #555555;
    font-size: 13px;
    left: 0;
    max-width: 40%;
    overflow-x: hidden;
    padding: 0.2em 0.5em;
    position: absolute;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

<template lang="pug">
  div
    webview(ref="webview", :class="isActive ? 'active' : 'hidden'")
    #browser-page-status(v-show="page.statusText") {{ page.statusText }}
</template>

<script>
  export default {
    props: [
      'isActive',
      'pageIndex',
    ],
    computed: {
      page() {
        return this.$store.getters.pages[this.pageIndex];
      },
    },
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
        'update-target-url': 'onUpdateTargetUrl',
        'media-started-playing': 'onMediaStartedPlaying',
        'media-paused': 'onMediaPaused',
        'page-favicon-updated': 'onPageFaviconUpdated',
        'enter-html-full-screen': 'onEnterHtmlFullScreen',
        'leave-html-full-screen': 'onLeaveHtmlFullScreen',
        'new-window': 'onNewWindow',
        'scroll-touch-begin': 'onScrollTouchBegin',
        'scroll-touch-end': 'onScrollTouchEnd',
      };

      Object.keys(webviewEvents).forEach((key) => {
        this.$refs.webview.addEventListener(key, this.webviewHandler(this, webviewEvents[key]));
      });

      this.$refs.webview.addEventListener('context-menu', (event) => {
        this.$parent.onWebviewContextMenu(event);
      });

      this.$refs.webview.addEventListener('wheel', (event) => {
        if (this.$parent.onWheel) {
          this.$parent.onWheel(event);
        }
      }, { passive: true });

      const ipc = this.$electron.ipcRenderer;
      ipc.on('scroll-touch-begin', (event, swipeGesture) => {
        if (this.$parent.onScrollTouchBegin) {
          this.$parent.onScrollTouchBegin(event, swipeGesture);
        }
      });
      ipc.on('scroll-touch-end', (event) => {
        if (this.$parent.onScrollTouchEnd) {
          this.$parent.onScrollTouchEnd(event, this.pageIndex);
        }
      });
      ipc.on('scroll-touch-edge', (event) => {
        if (this.$parent.onScrollTouchEdge) {
          this.$parent.onScrollTouchEdge(event);
        }
      });

      if (this.$store.getters.pages[this.pageIndex].location) {
        this.navigateTo(this.$store.getters.pages[this.pageIndex].location);
      }
    },
  };
</script>
