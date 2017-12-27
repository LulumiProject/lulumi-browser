<template lang="pug">
  div
    transition(name="notification")
      #notification(v-show="showNotification && isActive")
        notification
    webview(plugins,
            :element-loading-text="$t('tab.loading')",
            ref="webview",
            :class="isActive ? 'active' : 'hidden'")
    .findinpage-bar(ref="findinpageBar", v-show="!hidden && isActive")
      input(ref="findinpageInput", :placeholder="$t('tab.findInPage.placeholder')")
      span(ref="findinpageCount")
      div
        i(ref="findinpagePreviousMatch", class="el-icon-arrow-up")
        i(ref="findinpageNextMatch", class="el-icon-arrow-down")
        i(ref="findinpageEnd", class="el-icon-circle-close")
</template>

<script lang="ts">
  import { Component, Vue, Watch } from 'vue-property-decorator';

  import ResizeSensor from 'css-element-queries/src/ResizeSensor';

  import urlUtil from '../../js/lib/url-util';

  import Event from '../../../api/extensions/event';

  import Notification from './Notification.vue';

  import { tab, store } from 'lulumi';

  @Component({
    props: [
      'isActive',
      'windowId',
      'tabIndex',
      'tabId',
    ],
    components: {
      Notification,
    },
  })
  export default class Tab extends Vue {
    hidden: boolean = true;
    requestId: number | null | void = null;
    showNotification: boolean = false;
    onMessageEvent: Event = new Event();

    isActive: boolean;
    windowId: number;
    tabIndex: number;
    tabId: number;

    findinpage: tab.FindInPageObject;

    get dummyTabObject(): store.TabObject {
      return this.$store.getters.tabConfig.dummyTabObject;
    }
    get currentTabIndex(): number {
      return this.$store.getters.currentTabIndexes[this.windowId];
    }
    get tabs(): Array<store.TabObject> {
      return this.$store.getters.tabs.filter(tab => tab.windowId === this.windowId);
    }
    get tab(): store.TabObject {
      if (this.tabs.length === 0) {
        return this.dummyTabObject;
      }
      return this.tabs[this.tabIndex];
    }

    navigateTo(url) {
      if (this.$refs.webview) {
        (this.$refs.webview as Electron.WebviewTag).setAttribute('src', urlUtil.getUrlFromInput(url));
      }
    }
    webviewHandler(self, fnName) {
      return (event) => {
        if (self.$parent[fnName]) {
          self.$parent[fnName](event, this.tabIndex, this.tabId);
        }
      };
    }
    findInPage() {
      if (this.hidden) {
        this.findinpage.start();
        this.findinpage.counter.textContent = `
          ${this.$t('tab.findInPage.status', { activeMatch: 0, matches: 0 })} ${this.$tc('tab.findInPage.match', 1)}
        `;
      } else {
        this.findinpage.input.focus();
        (this.findinpage.input as HTMLInputElement).select();
      }
    }

    @Watch('isActive')
    onIsActive(newState: string): void {
      if (newState && !this.hidden) {
        this.$nextTick(() => (this.$refs.findinpageInput as HTMLInputElement).focus());
      }
    }

    mounted() {
      const webview = this.$refs.webview as Electron.WebviewTag;

      const webviewEvents = {
        'did-start-loading': 'onDidStartLoading',
        'load-commit': 'onLoadCommit',
        'page-title-set': 'onPageTitleSet',
        'dom-ready': 'onDomReady',
        'did-frame-finish-load': 'onDidFrameFinishLoad',
        'page-favicon-updated': 'onPageFaviconUpdated',
        'did-stop-loading': 'onDidStopLoading',
        'did-fail-load': 'onDidFailLoad',
        'did-finish-load': 'onDidFinishLoad',
        'did-get-redirect-request': 'onDidGetRedirectRequest',
        'did-get-response-details': 'onDidGetResponseDetails',
        'ipc-message': 'onIpcMessage',
        'console-message': 'onConsoleMessage',
        'update-target-url': 'onUpdateTargetUrl',
        'media-started-playing': 'onMediaStartedPlaying',
        'media-paused': 'onMediaPaused',
        'enter-html-full-screen': 'onEnterHtmlFullScreen',
        'leave-html-full-screen': 'onLeaveHtmlFullScreen',
        'new-window': 'onNewWindow',
        'scroll-touch-begin': 'onScrollTouchBegin',
        'scroll-touch-end': 'onScrollTouchEnd',
        'context-menu': 'onContextMenu',
        'will-navigate': 'onWillNavigate',
        'did-navigate': 'onDidNavigate',
        'did-navigate-in-page': 'onDidNavigateInPage',
      };

      Object.keys(webviewEvents).forEach((key) => {
        webview.addEventListener((key as any), this.webviewHandler(this, webviewEvents[key]));
      });

      this.findinpage = {
        input: this.$refs.findinpageInput,
        counter: this.$refs.findinpageCount,
        previous: this.$refs.findinpagePreviousMatch,
        next: this.$refs.findinpageNextMatch,
        endButton: this.$refs.findinpageEnd,
        activeWebview: webview,
        start: () => {
          this.findinpage.counter.textContent = '';
          this.hidden = false;
          this.$nextTick(() => {
            this.findinpage.input.focus();
            (this.findinpage.input as HTMLInputElement).select();
          });

          if ((this.findinpage.input as HTMLInputElement).value) {
            this.requestId = this.findinpage.activeWebview.findInPage((this.findinpage.input as HTMLInputElement).value);
          }
        },
        end: () => {
          this.hidden = true;

          this.$nextTick(() => {
            if (this.findinpage.activeWebview) {
              this.findinpage.activeWebview.stopFindInPage('keepSelection');
              if (this.findinpage.input === document.activeElement) {
                this.findinpage.activeWebview.focus();
              }
            }
          });
        },
      } as any;

      this.findinpage.endButton.addEventListener('click', () => {
        this.findinpage.end();
      });

      this.findinpage.input.addEventListener('input', (event) => {
        if ((event.target as HTMLInputElement).value) {
          this.requestId = this.findinpage.activeWebview.findInPage((event.target as HTMLInputElement).value);
        }
      });

      this.findinpage.input.addEventListener('keypress', (event) => {
        if (event.keyCode === 13) {
          this.requestId = this.findinpage.activeWebview.findInPage((this.findinpage.input as HTMLInputElement).value, {
            forward: true,
            findNext: true,
          });
        }
      });

      this.findinpage.previous.addEventListener('click', () => {
        if ((this.findinpage.input as HTMLInputElement).value) {
          this.requestId = this.findinpage.activeWebview.findInPage((this.findinpage.input as HTMLInputElement).value, {
            forward: false,
            findNext: true,
          });
        }
      });

      this.findinpage.next.addEventListener('click', () => {
        if ((this.findinpage.input as HTMLInputElement).value) {
          this.requestId = this.findinpage.activeWebview.findInPage((this.findinpage.input as HTMLInputElement).value, {
            forward: true,
            findNext: true,
          });
        }
      });

      webview.addEventListener('found-in-page', (event) => {
        if (event.result.requestId === this.requestId) {
          // for this.$tc pluralization
          let match;
          if (event.result.matches !== undefined) {
            if (event.result.matches === 0) {
              match = 1;
            } else {
              match = 2;
            }
            this.findinpage.counter.textContent
              = `${this.$t('tab.findInPage.status', { activeMatch: event.result.activeMatchOrdinal, matches: event.result.matches })} ${this.$tc('tab.findInPage.match', match)}`;
          }
        }
      });

      const nav = this.$parent.$refs.nav as HTMLDivElement;
      const findinpageBar = this.$refs.findinpageBar as HTMLDivElement;
      if (nav && findinpageBar) {
        /*
         * register the resize event on nav element to dynamically adjust
         * the height of webview element
         */
        new ResizeSensor(nav, () => {
          webview.style.height
            = `calc(100vh - ${nav.clientHeight}px)`;
          findinpageBar.style.top = `${nav.clientHeight}px`;
        });

        // fired once
        webview.style.height
          = `calc(100vh - ${nav.clientHeight}px)`;
        findinpageBar.style.top = `${nav.clientHeight}px`;

        // navigate
        this.navigateTo(this.tab.url);
      }
    }
  };
</script>

<style lang="less" scoped>
  #notification {
    width: 100vw;
    height: 35px;
    background: rgba(255, 193, 7, 0.28);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .notification-enter-active, .notification-leave-active {
    transition: opacity .5s;
  }
  .notification-enter, .notification-leave-active {
    opacity: 0
  }

  webview {
    height: 0px;
    width: 100vw;
    outline: none;
    position: relative;

    &[hidden] {
      flex: 0 1;
      width: 100vw;
      height: 0px !important;
    }

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99;
    }

    /* hack to work around display: none issues with webviews */
    &.hidden {
      flex: 0 1;
      width: 100vw;
      height: 0px !important;
    }
  }

  .findinpage-bar {
    right: 0px;
    color: ghostwhite;
    background: rgba(105, 105, 105, 0.8);
    border-bottom-left-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    padding: 5px 10px;
    animation: slideIn 25ms;
    position: absolute;
    -webkit-user-select: none;

    *:nth-child(1) {
      flex: 1;
    }

    *:nth-child(2) {
      flex: 2;
    }

    div {
      flex: 1;
      i.el-icon-arrow-up, i.el-icon-arrow-down, i.el-icon-circle-close {
        border: 1px solid transparent;
        font-size: 16px;
        margin: 0 2px;
        opacity: 0.5;
      }
    }
  }
</style>
