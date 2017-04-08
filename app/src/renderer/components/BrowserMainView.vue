<template lang="pug">
  div
    #nav
      tabs(ref="tab")
      navbar
    swipeArrow
    page(v-for="(page, index) in pages", :isActive="index == currentPageIndex", :pageIndex="index", :ref="`page-${index}`", :key="`page-${page.pid}`")
    #footer
      transition(name="extend")
        .browser-page-status(v-show="page.statusText") {{ page.statusText }}
      download(v-show="$store.getters.downloads.length !== 0 && showDownloadBar")
</template>

<script>
  import url from 'url';

  import Tabs from './BrowserMainView/Tabs';
  import Navbar from './BrowserMainView/Navbar';
  import swipeArrow from './BrowserMainView/SwipeArrow';
  import Page from './BrowserMainView/Page';
  import Download from './BrowserMainView/Download';

  import urlUtil from '../js/lib/url-util';
  import imageUtil from '../js/lib/image-util';
  import urlResource from '../js/lib/url-resource';
  import tabsOrdering from '../js/lib/tabs-ordering';

  import ExtensionService from '../../api/extension-service';
  import Event from '../../api/extensions/event';
  import Tab from '../../api/extensions/tab';

  export default {
    data() {
      return {
        trackingFingers: false,
        swipeGesture: false,
        isSwipeOnEdge: false,
        deltaX: 0,
        deltaY: 0,
        hnorm: 0,
        startTime: 0,
        extensionService: null,
        showDownloadBar: false,
        onCreatedEvent: new Event(),
        onRemovedEvent: new Event(),
      };
    },
    components: {
      Tabs,
      Navbar,
      swipeArrow,
      Page,
      Download,
    },
    name: 'browser-main',
    computed: {
      page() {
        if (this.$store.getters.pages.length === 0) {
          return { statusText: false };
        }
        return this.$store.getters.pages[this.$store.getters.currentPageIndex];
      },
      pages() {
        return this.$store.getters.pages;
      },
      tabsOrder() {
        return this.$store.getters.tabsOrder;
      },
      currentPageIndex() {
        return this.$store.getters.currentPageIndex;
      },
      homepage() {
        return this.$store.getters.homepage;
      },
      pdfViewer() {
        return this.$store.getters.pdfViewer;
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
        const location = webview.getURL();
        const parsedURL = url.parse(location, true);
        if (parsedURL.protocol === 'chrome:' && parsedURL.hostname === 'pdf-viewer') {
          if (this.pdfViewer === 'pdf-viewer') {
            this.$store.dispatch('domReady', {
              pageIndex,
              webview,
            });
          } else {
            webview.downloadURL(parsedURL.query.src);
          }
        } else {
          this.$store.dispatch('domReady', {
            pageIndex,
            webview,
          });
        }
        this.extensionService.activate();
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
        this.$el.querySelector('#nav').style.display = 'none';
        this.getWebView().style.height = '100vh';
      },
      onLeaveHtmlFullScreen() {
        this.$el.querySelector('#nav').style.display = 'block';
        this.getWebView().style.height = 'calc(100vh - 73px)';
      },
      onNewWindow(event) {
        this.$store.dispatch('incrementPid');
        this.$store.dispatch('createTab', event.url);
      },
      onWheel(event) {
        const leftSwipeArrow = document.getElementById('left-swipe-arrow');
        const rightSwipeArrow = document.getElementById('right-swipe-arrow');

        const SWIPE_TRIGGER_DIST = 200;
        const ARROW_OFF_DIST = 40;

        if (this.trackingFingers) {
          this.deltaX += event.deltaX;
          this.deltaY += event.deltaY;

          if (Math.abs(this.deltaY) > Math.abs(this.deltaX)) {
            this.hnorm = 0;
          } else if ((this.deltaX < 0 && !this.getWebView().canGoBack())
            || (this.deltaX > 0 && !this.getWebView().canGoForward())) {
            this.hnorm = 0;
            this.deltaX = 0;
          } else {
            this.hnorm = this.deltaX / SWIPE_TRIGGER_DIST;
          }
          this.hnorm = Math.min(1.0, Math.max(-1.0, this.hnorm));

          if (this.deltaX < 0) {
            leftSwipeArrow.style.left = `${((-1 * ARROW_OFF_DIST) - (this.hnorm * ARROW_OFF_DIST))}px`;
            rightSwipeArrow.style.right = `${(-1 * ARROW_OFF_DIST)}px`;
          }
          if (this.deltaX > 0) {
            leftSwipeArrow.style.left = `${(-1 * ARROW_OFF_DIST)}px`;
            rightSwipeArrow.style.right = `${((-1 * ARROW_OFF_DIST) + (this.hnorm * ARROW_OFF_DIST))}px`;
          }

          if (this.hnorm <= -1) {
            leftSwipeArrow.classList.add('highlight');
          } else {
            leftSwipeArrow.classList.remove('highlight');
          }
          if (this.hnorm >= 1) {
            rightSwipeArrow.classList.add('highlight');
          } else {
            rightSwipeArrow.classList.remove('highlight');
          }
        }
      },
      onOpenPDF(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          const webview = this.$electron.remote.webContents.fromId(data.webContentsId);
          if (this.pdfViewer === 'pdf-viewer') {
            const parsedURL = url.parse(data.location, true);
            webview.downloadURL(`${parsedURL.query.file}?skip=true`);
          } else {
            webview.loadURL(data.location);
          }
        }
      },
      onWillDownloadAnyFile(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          this.showDownloadBar = true;
          this.$store.dispatch('createDownloadTask', {
            name: data.name,
            url: data.url,
            totalBytes: data.totalBytes,
            isPaused: data.isPaused,
            canResume: data.canResume,
            startTime: data.startTime,
            getReceivedBytes: 0,
            state: data.state,
            style: '',
          });
        }
      },
      onUpdateDownloadsProgress(event, data) {
        this.$store.dispatch('updateDownloadsProgress', {
          startTime: data.startTime,
          getReceivedBytes: data.getReceivedBytes,
          savePath: data.savePath,
          isPaused: data.isPaused,
          canResume: data.canResume,
          state: data.state,
        });
      },
      onCompleteDownloadsProgress(event, data) {
        this.$store.dispatch('completeDownloadsProgress', {
          name: data.name,
          startTime: data.startTime,
          state: data.state,
        });
        let option = null;
        if (data.state === 'completed') {
          option = {
            title: 'Success',
            body: `${data.name} download successfully!`,
          };
        } else if (data.state === 'cancelled') {
          option = {
            title: 'Cancelled',
            body: `${data.name} has been cancelled!`,
          };
        } else {
          option = {
            title: 'Success',
            body: `${data.name} download successfully!`,
          };
        }
        /* eslint-disable no-new */
        new Notification(option.title, option);
      },
      onCloseDownloadBar() {
        this.showDownloadBar = false;
        this.$store.dispatch('closeDownloadBar');
      },
      onScrollTouchBegin(event, swipeGesture) {
        if (swipeGesture) {
          this.trackingFingers = true;
          this.isSwipeOnEdge = false;
        }
      },
      onScrollTouchEnd() {
        const leftSwipeArrow = document.getElementById('left-swipe-arrow');
        const rightSwipeArrow = document.getElementById('right-swipe-arrow');

        const ARROW_OFF_DIST = 40;

        if (this.trackingFingers && this.isSwipeOnEdge) {
          if (this.hnorm <= -1) {
            this.getWebView().goBack();
          }
          if (this.hnorm >= 1) {
            this.getWebView().goForward();
          }
        }
        leftSwipeArrow.classList.add('returning');
        leftSwipeArrow.classList.remove('highlight');
        leftSwipeArrow.style.left = `${(-1 * ARROW_OFF_DIST)}px`;
        rightSwipeArrow.classList.add('returning');
        rightSwipeArrow.classList.remove('highlight');
        rightSwipeArrow.style.right = `${(-1 * ARROW_OFF_DIST)}px`;


        this.trackingFingers = false;
        this.deltaX = 0;
        this.deltaY = 0;
        this.hnorm = 0;
      },
      onScrollTouchEdge() {
        this.isSwipeOnEdge = true;
      },
      onGetSearchEngineProvider(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          webContents.send('guest-here-your-data', {
            searchEngine: this.$store.getters.searchEngine,
            currentSearchEngine: this.$store.getters.currentSearchEngine,
          });
        }
      },
      onSetSearchEngineProvider(event, data) {
        this.$store.dispatch('setCurrentSearchEngineProvider', data.val);
        const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', {
          searchEngine: this.$store.getters.searchEngine,
          currentSearchEngine: this.$store.getters.currentSearchEngine,
        });
      },
      onGetHomepage(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          webContents.send('guest-here-your-data', {
            homepage: this.$store.getters.homepage,
          });
        }
      },
      onSetHomepage(event, data) {
        this.$store.dispatch('setHomepage', data.val);
        const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', {
          homepage: this.$store.getters.homepage,
        });
      },
      onGetPDFViewer(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          webContents.send('guest-here-your-data', {
            pdfViewer: this.$store.getters.pdfViewer,
          });
        }
      },
      onSetPDFViewer(event, data) {
        this.$store.dispatch('setPDFViewer', data.val);
        const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', {
          pdfViewer: this.$store.getters.pdfViewer,
        });
      },
      onGetTabConfig(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
        }
      },
      onSetTabConfig(event, data) {
        this.$store.dispatch('setTabConfig', data.val);
        const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
      },
      onGetDownloads(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          webContents.send('guest-here-your-data', this.$store.getters.downloads);
        }
      },
      onSetDownloads(event, data) {
        this.$store.dispatch('setDownloads', data.val);
        const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.downloads);
      },
      onGetHistory(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          webContents.send('guest-here-your-data', this.$store.getters.history);
        }
      },
      onSetHistory(event, data) {
        this.$store.dispatch('setHistory', data.val);
        const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.history);
      },
      // tabHandlers
      onNewTab(location) {
        this.$store.dispatch('incrementPid');
        if (location) {
          this.$store.dispatch('createTab', location);
        } else {
          this.$store.dispatch('createTab');
        }
        this.onCreatedEvent.emit(new Tab(this.currentPageIndex + 1, null));
      },
      onTabClick(event, pageIndex) {
        this.$store.dispatch('clickTab', pageIndex);
      },
      onTabClose(event, pageIndex) {
        this.onRemovedEvent.emit(new Tab(pageIndex, this.getPage(pageIndex)));
        const newPages = tabsOrdering(this.pages, this.$refs.tab, 0, this.tabsOrder, true);
        this.$store.dispatch('setPages', {
          pid: this.$store.getters.pid,
          pages: newPages,
        });
        this.$nextTick(() => {
          if (pageIndex === undefined) {
            pageIndex = this.currentPageIndex;
          }
          if (this.tabsOrder.length === 0) {
            this.$store.dispatch('closeTab', pageIndex);
          } else {
            this.$store.dispatch('closeTab', this.tabsOrder.findIndex(element => element === pageIndex));
          }
          this.$store.dispatch('setTabsOrder', []);
        });
      },
      // navHandlers
      onClickHome() {
        this.getPage().navigateTo(this.homepage);
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
        let newLocation = null;
        if (location.startsWith('about:')) {
          newLocation = urlResource.aboutUrls(location);
          this.getPage().navigateTo(newLocation);
        } else if (urlUtil.isNotURL(location)) {
          newLocation = `${this.$store.getters.currentSearchEngine.search}${location}`;
          this.$store.dispatch('updateLocation', newLocation);
          this.getPage().navigateTo(newLocation);
        } else {
          newLocation = location;
          this.getPage().navigateTo(newLocation);
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
      // onClickBackContextMenu
      onClickBackContextMenu() {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();
        const webview = this.getWebView();
        const webContents = webview.getWebContents();
        const navbar = document.getElementById('browser-navbar');
        const goBack = document.getElementById('browser-navbar__goBack');

        const current = webContents.getActiveIndex();
        const history = webContents.history;

        if (current === history.length - 1 && current !== 0) {
          for (let i = current - 1; i >= 0; i--) {
            menu.append(new MenuItem({
              label: history[i],
              click: () => webview.goToIndex(i),
            }));
          }

          menu.append(new MenuItem({ type: 'separator' }));
          menu.append(new MenuItem({
            label: 'Show history',
            click: () => {
              this.$store.dispatch('createTab', 'lulumi://about/#/history');
            },
          }));

          menu.popup(this.$electron.remote.getCurrentWindow(), {
            async: true,
            x: Math.floor(goBack.getBoundingClientRect().left),
            y: Math.floor(navbar.getBoundingClientRect().bottom),
          });
        }
      },
      // onClickForwardContextMenu
      onClickForwardContextMenu() {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();
        const webview = this.getWebView();
        const webContents = webview.getWebContents();
        const navbar = document.getElementById('browser-navbar');
        const goForward = document.getElementById('browser-navbar__goForward');

        const current = webContents.getActiveIndex();
        const history = webContents.history;

        if (current < history.length - 1) {
          for (let i = current + 1; i < history.length; i++) {
            menu.append(new MenuItem({
              label: history[i],
              click: () => webview.goToIndex(i),
            }));
          }

          menu.append(new MenuItem({ type: 'separator' }));
          menu.append(new MenuItem({
            label: 'Show history',
            click: () => {
              this.$store.dispatch('createTab', 'lulumi://about/#/history');
            },
          }));

          menu.popup(this.$electron.remote.getCurrentWindow(), {
            async: true,
            x: Math.floor(goForward.getBoundingClientRect().left),
            y: Math.floor(navbar.getBoundingClientRect().bottom),
          });
        }
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
            this.onEnterLocation(location);
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
                        imageUtil.getBase64FromImageUrl(event.params.srcURL).then((dataURL) => {
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
        const sourceLocation = urlUtil.getViewSourceUrlFromUrl(this.getPageObject().location);
        if (sourceLocation !== null) {
          menu.append(new MenuItem({
            label: 'View Source',
            click: () => {
              this.$store.dispatch('incrementPid');
              this.$store.dispatch('createTab', sourceLocation);
            },
          }));
        }
        menu.append(new MenuItem({
          label: 'Inspect Element',
          click: () => {
            this.getWebView().inspectElement(event.params.x, event.params.y);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow(), { async: true });
      },
    },
    beforeMount() {
      const ipc = this.$electron.ipcRenderer;

      ipc.on('set-app-state', (event, newState) => {
        if (newState && Object.keys(newState).length !== 0) {
          this.$store.dispatch('setAppState', newState);
        } else {
          this.$store.dispatch('createTab');
        }
      });
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

      if (window.process.platform === 'darwin') {
        document.body.classList.add('darwin');
      }

      ipc.on('open-pdf', (event, data) => {
        if (this.onOpenPDF) {
          this.onOpenPDF(event, data);
        }
      });

      ipc.on('will-download-any-file', (event, data) => {
        if (this.onWillDownloadAnyFile) {
          this.onWillDownloadAnyFile(event, data);
        }
      });

      ipc.on('update-downloads-progress', (event, data) => {
        if (this.onUpdateDownloadsProgress) {
          this.onUpdateDownloadsProgress(event, data);
        }
      });
      ipc.on('complete-downloads-progress', (event, data) => {
        if (this.onCompleteDownloadsProgress) {
          this.onCompleteDownloadsProgress(event, data);
        }
      });

      ipc.on('get-search-engine-provider', (event, data) => {
        if (this.onGetSearchEngineProvider) {
          this.onGetSearchEngineProvider(event, data);
        }
      });
      ipc.on('set-search-engine-provider', (event, val) => {
        if (this.onSetSearchEngineProvider) {
          this.onSetSearchEngineProvider(event, val);
        }
      });
      ipc.on('get-homepage', (event, data) => {
        if (this.onGetHomepage) {
          this.onGetHomepage(event, data);
        }
      });
      ipc.on('set-homepage', (event, val) => {
        if (this.onSetHomepage) {
          this.onSetHomepage(event, val);
        }
      });
      ipc.on('get-pdf-viewer', (event, data) => {
        if (this.onGetPDFViewer) {
          this.onGetPDFViewer(event, data);
        }
      });
      ipc.on('set-pdf-viewer', (event, val) => {
        if (this.onSetPDFViewer) {
          this.onSetPDFViewer(event, val);
        }
      });
      ipc.on('get-tab-config', (event, data) => {
        if (this.onGetTabConfig) {
          this.onGetTabConfig(event, data);
        }
      });
      ipc.on('set-tab-config', (event, val) => {
        if (this.onSetTabConfig) {
          this.onSetTabConfig(event, val);
        }
      });
      ipc.on('get-downloads', (event, data) => {
        if (this.onGetDownloads) {
          this.onGetDownloads(event, data);
        }
      });
      ipc.on('set-downloads', (event, val) => {
        if (this.onSetDownloads) {
          this.onSetDownloads(event, val);
        }
      });
      ipc.on('get-history', (event, data) => {
        if (this.onGetHistory) {
          this.onGetHistory(event, data);
        }
      });
      ipc.on('set-history', (event, val) => {
        if (this.onSetHistory) {
          this.onSetHistory(event, val);
        }
      });

      ipc.on('request-app-state', (event, force) => {
        const newStart = Math.ceil(Math.random() * 10000);
        const newPages = tabsOrdering(this.pages, this.$refs.tab, newStart, this.tabsOrder);
        const downloads = this.$store.getters.downloads.filter(download => download.state === 'progressing');
        if (downloads.length !== 0) {
          if (force) {
            ipc.send('response-app-state', {
              ready: true,
              newState: {
                pid: newStart + (newPages.length - 1),
                pages: newPages,
                currentPageIndex: this.currentPageIndex,
                currentSearchEngine: this.$store.getters.currentSearchEngine,
                homepage: this.$store.getters.homepage,
                pdfViewer: this.$store.getters.pdfViewer,
                tabConfig: this.$store.getters.tabConfig,
                downloads: this.$store.getters.downloads.filter(download => download.state !== 'progressing'),
                history: this.$store.getters.history,
              },
            });
          } else {
            this.$electron.remote.dialog.showMessageBox({
              type: 'warning',
              title: 'Warning',
              message: 'You still have some files progressing.',
              buttons: ['Abort and Leave', 'Cancel'],
            }, (index) => {
              if (index === 0) {
                downloads.map((download) => {
                  this.$electron.ipcRenderer.send('cancel-downloads-progress', download.startTime);
                  return true;
                });
                ipc.send('response-app-state', {
                  ready: true,
                  newState: {
                    pid: newStart + (newPages.length - 1),
                    pages: newPages,
                    currentPageIndex: this.currentPageIndex,
                    currentSearchEngine: this.$store.getters.currentSearchEngine,
                    homepage: this.$store.getters.homepage,
                    pdfViewer: this.$store.getters.pdfViewer,
                    tabConfig: this.$store.getters.tabConfig,
                    downloads: this.$store.getters.downloads.filter(download => download.state !== 'progressing'),
                    history: this.$store.getters.history,
                  },
                });
              }
            });
          }
        } else {
          ipc.send('response-app-state', {
            ready: true,
            newState: {
              pid: newStart + (newPages.length - 1),
              pages: newPages,
              currentPageIndex: this.currentPageIndex,
              currentSearchEngine: this.$store.getters.currentSearchEngine,
              homepage: this.$store.getters.homepage,
              pdfViewer: this.$store.getters.pdfViewer,
              tabConfig: this.$store.getters.tabConfig,
              downloads: this.$store.getters.downloads,
              history: this.$store.getters.history,
            },
          });
        }
      });

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

      this.extensionService = new ExtensionService(this);
      ipc.send('request-app-state');
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
  }

  #nav {
    width: 100vw;
  }

  #footer {
    bottom: 0;
    position: absolute;
  }
  #footer > .browser-page-status {
    background: #F3F3F3;
    border-color: #d3d3d3;
    border-style: solid;
    border-width: 1px 1px 0 0;
    border-top-right-radius: 4px;
    bottom: 0;
    color: #555555;
    font-size: 13px;
    float: left;
    width: auto;
    overflow-x: hidden;
    padding: 0.2em 0.5em;
    position: relative;
  }
  #footer > .extend-enter-active {
    transition-property: text-overflow, white-space;
    transition-duration: 1s;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 50vw;
  }
</style>
