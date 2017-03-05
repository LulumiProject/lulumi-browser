<template lang="pug">
  div
    #nav
      tabs
      navbar
    page(v-for="(page, i) in pages", :isActive="i == currentPageIndex", :pageIndex="i", :ref="`page-${i}`", :key="`page-${page.pid}`")
    transition(name="extend")
      .browser-page-status(v-show="page.statusText") {{ page.statusText }}
</template>

<script>
  import Tabs from './BrowserMainView/Tabs';
  import Navbar from './BrowserMainView/Navbar';
  import Page from './BrowserMainView/Page';

  import urlUtil from '../js/lib/urlutil';

  export default {
    data() {
      return {
        trackingFingers: false,
        swipeGesture: false,
        isSwipeOnEdge: false,
        deltaX: 0,
        deltaY: 0,
        startTime: 0,
        time: 0,
      };
    },
    components: {
      Tabs,
      Navbar,
      Page,
    },
    name: 'browser-main',
    computed: {
      page() {
        return this.$store.getters.pages[this.$store.getters.currentPageIndex];
      },
      pages() {
        return this.$store.getters.pages;
      },
      currentPageIndex() {
        return this.$store.getters.currentPageIndex;
      },
    },
    methods: {
      getWebView(i) {
        i = (typeof i === 'undefined') ? this.$store.getters.currentPageIndex : i;
        return this.$refs[`page-${i}`][0].$refs.webview;
      },
      getPage(i) {
        i = (typeof i === 'undefined') ? this.$store.getters.currentPageIndex : i;
        return this.$refs[`page-${i}`][0];
      },
      getPageObject(i) {
        i = (typeof i === 'undefined') ? this.$store.getters.currentPageIndex : i;
        return this.$store.getters.pages[i];
      },
      // pageHandlers
      onDidStartLoading(event, pageIndex) {
        this.$store.dispatch('didStartLoading', pageIndex);
      },
      onDomReady(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('domReady', {
          pageIndex,
          webview,
        });
      },
      onDidStopLoading(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('didStopLoading', {
          pageIndex,
          webview,
        });
      },
      onDidFailLoad(event, pageIndex) {
        this.$store.dispatch('didFailLoad', pageIndex);
        const appPath = process.env.NODE_ENV === 'development'
          ? process.cwd()
          : this.$electron.remote.app.getAppPath();
        let errorPage = process.env.NODE_ENV === 'development'
          ? `file://${appPath}/app/pages/error/index.html`
          : `file://${appPath}/pages/error/index.html`;
        errorPage += `?ec=${encodeURIComponent(event.errorCode)}`;
        errorPage += `&url=${encodeURIComponent(event.target.getURL())}`;
        if (event.errorCode !== -3 && event.validatedURL === event.target.getURL()) {
          this.getPage(pageIndex).navigateTo(
            `${errorPage}`);
        }
      },
      onPageTitleSet(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('pageTitleSet', {
          pageIndex,
          webview,
        });
      },
      onUpdateTargetUrl(event, pageIndex) {
        this.$store.dispatch('updateTargetUrl', {
          pageIndex,
          url: event.url,
        });
      },
      onMediaStartedPlaying(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('mediaStartedPlaying', {
          pageIndex,
          webview,
        });
      },
      onMediaPaused(event, pageIndex) {
        this.$store.dispatch('mediaPaused', pageIndex);
      },
      onToggleAudio(event, pageIndex, muted) {
        this.getWebView(pageIndex).setAudioMuted(muted);
        this.$store.dispatch('toggleAudio', {
          pageIndex,
          muted,
        });
      },
      onPageFaviconUpdated(event, pageIndex) {
        this.$store.dispatch('pageFaviconUpdated', {
          pageIndex,
          url: event.favicons[0],
        });
      },
      onEnterHtmlFullScreen() {
        this.$el.querySelector('#nav').style.height = 0;
        this.getWebView().style.height = '100vh';
      },
      onLeaveHtmlFullScreen() {
        this.$el.querySelector('#nav').style.height = '73px';
        this.getWebView().style.height = 'calc(100vh - 73px)';
      },
      onNewWindow(event) {
        this.$store.dispatch('incrementPid');
        this.$store.dispatch('createTab', event.url);
      },
      onWheel(event) {
        if (this.trackingFingers) {
          this.deltaX = this.deltaX + event.deltaX;
          this.deltaY = this.deltaY + event.deltaY;
          this.time = (new Date()).getTime() - this.startTime;
        }
      },
      onWillDownload(event, pageIndex, data) {
        if (this.getWebView(pageIndex).getWebContents().getId() === data.webContentsId) {
          this.getPage(pageIndex).navigateTo(data.location);
        }
      },
      onScrollTouchBegin(event, swipeGesture) {
        if (swipeGesture) {
          this.trackingFingers = true;
          this.isSwipeOnEdge = false;
          this.startTime = (new Date()).getTime();
        }
      },
      onScrollTouchEnd() {
        if (this.time > 50
              && this.trackingFingers
              && Math.abs(this.deltaY) < 50
              && this.isSwipeOnEdge) {
          if (this.deltaX > 70) {
            this.getWebView().goForward();
          } else if (this.deltaX < -70) {
            this.getWebView().goBack();
          }
        }
        this.trackingFingers = false;
        this.deltaX = 0;
        this.deltaY = 0;
        this.startTime = 0;
      },
      onScrollTouchEdge() {
        this.isSwipeOnEdge = true;
      },
      // tabHandlers
      onNewTab() {
        this.$store.dispatch('incrementPid');
        this.$store.dispatch('createTab');
      },
      onTabClick(event, pageIndex) {
        this.$store.dispatch('clickTab', pageIndex);
      },
      onTabClose(event, pageIndex) {
        this.$store.dispatch('closeTab', pageIndex);
      },
      // navHandlers
      onClickHome() {
        this.getPage().navigateTo();
      },
      onClickBack() {
        if (this.getPageObject().error) {
          this.getWebView().goToOffset(-2);
        } else {
          this.getWebView().goBack();
        }
      },
      onClickForward() {
        this.getWebView().goForward();
      },
      onClickStop() {
        this.getWebView().stop();
      },
      onClickRefresh() {
        this.getWebView().reload();
      },
      onEnterLocation(location) {
        if (urlUtil.isNotURL(location)) {
          const newLocation = `${this.$store.getters.searchEngine}${location}`;
          this.$store.dispatch('updateLocation', newLocation);
          this.getPage().navigateTo(newLocation);
        } else {
          this.getPage().navigateTo(location);
        }
      },
      // onTabContextMenu
      onTabContextMenu(event, pageIndex) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();

        menu.append(new MenuItem({
          label: 'New Tab',
          click: () => {
            this.$store.dispatch('incrementPid');
            this.$store.dispatch('createTab');
          },
        }));
        menu.append(new MenuItem({
          label: 'Duplicate',
          click: () => {
            this.$store.dispatch('incrementPid');
            this.$store.dispatch('createTab', this.pages[pageIndex].location);
          },
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: 'Close Tab',
          click: () => {
            this.$store.dispatch('closeTab', pageIndex);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow(), { async: true });
      },
      // onNavContextMenu
      onNavContextMenu(event) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();
        const el = event.target;
        const clipboard = this.$electron.clipboard;

        menu.append(new MenuItem({
          label: 'Cut',
          role: 'cut',
        }));
        menu.append(new MenuItem({
          label: 'Copy',
          role: 'copy',
        }));
        menu.append(new MenuItem({
          label: 'Paste',
          role: 'paste',
        }));
        menu.append(new MenuItem({
          label: 'Paste and Go',
          click: () => {
            let location = el.value.slice(0, el.selectionStart);
            location += clipboard.readText();
            location += el.value.slice(el.selectionEnd);
            this.$store.dispatch('updateLocation', location);
            this.getPage().navigateTo(location);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow(), { async: true });
      },
      // onWebviewContextMenu
      onWebviewContextMenu(event) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();
        const clipboard = this.$electron.clipboard;

        if (event.params.editFlags.canUndo) {
          menu.append(new MenuItem({
            label: 'Undo',
            role: 'undo',
          }));
        }

        if (event.params.editFlags.canRedo) {
          menu.append(new MenuItem({
            label: 'Redo',
            role: 'redo',
          }));
        }

        menu.append(new MenuItem({ type: 'separator' }));

        if (event.params.editFlags.canCut) {
          menu.append(new MenuItem({
            label: 'Cut',
            role: 'cut',
          }));
        }

        if (event.params.editFlags.canCopy) {
          menu.append(new MenuItem({
            label: 'Copy',
            role: 'copy',
          }));
        }

        if (event.params.editFlags.canPaste) {
          menu.append(new MenuItem({
            label: 'Paste',
            role: 'paste',
          }));
          menu.append(new MenuItem({
            label: 'Paste Without Formatting',
            role: 'pasteandmatchstyle',
          }));
        }

        menu.append(new MenuItem({
          label: 'Select All',
          role: 'selectall',
        }));
        menu.append(new MenuItem({ type: 'separator' }));

        if (event.params.linkURL) {
          menu.append(new MenuItem({
            label: 'Open Link in New Tab',
            click: () => {
              this.$store.dispatch('incrementPid');
              this.$store.dispatch('createTab', event.params.linkURL);
            },
          }));
          menu.append(new MenuItem({
            label: 'Copy Link Address',
            click: () => {
              clipboard.writeText(event.params.linkURL);
            },
          }));
        }

        if (event.params.hasImageContents) {
          menu.append(new MenuItem({
            label: 'Save Image As...',
            click: () => {
              const fs = require('fs');
              const path = require('path');
              const electron = this.$electron;
              urlUtil.getFilenameFromUrl(event.params.srcURL).then(
                (filename) => {
                  const defaultPath = path.join(electron.remote.app.getPath('downloads'), filename);
                  electron.remote.dialog.showSaveDialog(
                    electron.remote.getCurrentWindow(), {
                      defaultPath,
                      filters: [
                        {
                          name: 'Images',
                          extensions: ['jpg', 'jpeg', 'png', 'gif'],
                        },
                      ],
                    }, (filename) => {
                      if (filename) {
                        const { getBase64FromImageUrl } = require('../js/lib/imageutil');
                        getBase64FromImageUrl(event.params.srcURL).then((dataURL) => {
                          fs.writeFileSync(filename,
                            electron.nativeImage.createFromDataURL(dataURL).toPNG());
                        });
                      }
                    },
                  );
                },
              );
            },
          }));
          menu.append(new MenuItem({
            label: 'Copy Image URL',
            click: () => {
              clipboard.writeText(event.params.srcURL);
            },
          }));
          menu.append(new MenuItem({
            label: 'Open Image in New Tab',
            click: () => {
              this.$store.dispatch('incrementPid');
              this.$store.dispatch('createTab', event.params.srcURL);
            },
          }));
        }

        menu.append(new MenuItem({ type: 'separator' }));
        if (event.params.selectionText) {
          if (event.params.editFlags.canCopy) {
            menu.append(new MenuItem({
              label: `Search for "${event.params.selectionText}"`,
              click: () => {
                this.$store.dispatch('incrementPid');
                this.$store.dispatch('createTab', event.params.selectionText);
              },
            }));
          }
        }
        const macOS = /^darwin/.test(process.platform);
        if (macOS) {
          if (event.params.selectionText) {
            menu.append(new MenuItem({
              label: `Look up "${event.params.selectionText}"`,
              click: () => {
                this.getWebView().showDefinitionForSelection();
              },
            }));
            menu.append(new MenuItem({ type: 'separator' }));
          }
        }
        menu.append(new MenuItem({
          label: 'View Source',
          click: () => {
            const sourceLocation = urlUtil.getViewSourceUrlFromUrl(this.getPageObject().location);
            if (sourceLocation !== null) {
              this.$store.dispatch('incrementPid');
              this.$store.dispatch('createTab', sourceLocation);
            }
          },
        }));
        menu.append(new MenuItem({
          label: 'Inspect Element',
          click: () => {
            this.getWebView().inspectElement(event.params.x, event.params.y);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow(), { async: true });
      },
    },
    mounted() {
      const ipc = this.$electron.ipcRenderer;

      this.onDidStartLoading.bind(this);
      this.onDomReady.bind(this);
      this.onDidStopLoading.bind(this);
      this.onDidFailLoad.bind(this);
      this.onPageTitleSet.bind(this);
      this.onUpdateTargetUrl.bind(this);
      this.onMediaStartedPlaying.bind(this);
      this.onMediaPaused.bind(this);
      this.onToggleAudio.bind(this);
      this.onPageFaviconUpdated.bind(this);
      this.onNewTab.bind(this);
      this.onTabClick.bind(this);
      this.onTabClose.bind(this);
      this.onTabContextMenu.bind(this);
      this.onWebviewContextMenu.bind(this);
      this.onScrollTouchBegin.bind(this);
      this.onScrollTouchEnd.bind(this);

      ipc.on('scroll-touch-begin', (event, swipeGesture) => {
        if (this.onScrollTouchBegin) {
          this.onScrollTouchBegin(event, swipeGesture);
        }
      });
      ipc.on('scroll-touch-end', (event) => {
        if (this.onScrollTouchEnd) {
          this.onScrollTouchEnd(event);
        }
      });
      ipc.on('scroll-touch-edge', (event) => {
        if (this.onScrollTouchEdge) {
          this.onScrollTouchEdge(event);
        }
      });
    },
  };
</script>

<style scoped>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  [hidden] {
    display: none !important;
  }
  body,
  html {
    position: relative;
    overflow: hidden;
    -webkit-user-select: none;
  }
  #nav {
    width: 100vw;
  }

  .browser-page-status {
    background: #F3F3F3;
    border-color: #d3d3d3;
    border-style: solid;
    border-width: 1px 1px 0 0;
    border-top-right-radius: 4px;
    bottom: 0;
    color: #555555;
    font-size: 13px;
    left: 0;
    width: auto;
    overflow-x: hidden;
    padding: 0.2em 0.5em;
    position: absolute;
  }
  .extend-enter-active {
    transition-property: text-overflow, white-space;
    transition-duration: 1s;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 40%;
  }
</style>
