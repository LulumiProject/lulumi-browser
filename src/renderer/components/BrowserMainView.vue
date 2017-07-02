<template lang="pug">
  div
    #nav
      tabs(ref="tabs")
      navbar(ref="navbar")
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
  import responseNewState from '../js/lib/response-new-state';

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
        showDownloadBar: false,
        extensionService: null,
        contextMenus: {},
        onUpdatedEvent: new Event(),
        onCreatedEvent: new Event(),
        onRemovedEvent: new Event(),
        alarms: {},
        onActivatedEvent: new Event(),
        onAlarmEvent: new Event(),
        onBeforeNavigate: new Event(),
        onCreatedNavigationTarget: new Event(),
        onCommitted: new Event(),
        onCompleted: new Event(),
        onDOMContentLoaded: new Event(),
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
      historyMappings() {
        const history = this.$store.getters.history;
        const out = {};

        history.forEach((h) => {
          if (!out[h.url]) {
            out[h.url] = {
              title: h.title,
              icon: h.favicon,
            };
          }
        });
        return out;
      },
      lastOpenedTabs() {
        return this.$store.getters.lastOpenedTabs.slice(0, 8);
      },
      // lulumi.alarms
      getAlarm(name) {
        return this.alarms[name];
      },
      getAllAlarm() {
        return this.alarms;
      },
      clearAlarm(name) {
        if (this.alarms[name] && this.alarms[name].handler) {
          if (this.alarms[name].periodInMinutes) {
            clearInterval(this.alarms[name].handler);
          }
        }
        return delete this.alarms[name];
      },
      clearAllAlarm() {
        Object.values(this.alarms).forEach((alarm) => {
          if (alarm.handler) {
            if (alarm.periodInMinutes) {
              clearInterval(alarm.handler);
            } else {
              clearTimeout(alarm.handler);
            }
          }
        });
        this.alarms = {};
      },
      createAlarm(name, alarmInfo) {
        this.clearAlarm(name);
        let timeout;
        this.alarms[name] = alarmInfo;
        if (alarmInfo.when) {
          timeout = alarmInfo.when - Date.now();
        } else if (alarmInfo.delayInMinutes) {
          timeout = alarmInfo.delayInMinutes * 60 * 1000;
        }
        if (alarmInfo.periodInMinutes) {
          this.alarms[name].handler
            = setInterval(() => this.onAlarmEvent.emit(this.alarms[name]), timeout);
        } else {
          this.alarms[name].handler
            = setTimeout(() => this.onAlarmEvent.emit(this.alarms[name]), timeout);
        }
      },
      addContextMenus(menuItems, webContentsId) {
        this.contextMenus[`'${webContentsId}'`] = [menuItems];
      },
      // pageHandlers
      onDidStartLoading(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('didStartLoading', {
          pageIndex,
          webview,
        });
        this.$store.dispatch('updateMappings', {
          webContentsId: webview.getWebContents().id,
          pageIndex,
        });
        this.onCommitted.emit({
          frameId: 0,
          parentFrameId: -1,
          processId: this.getWebView(pageIndex).getWebContents().getOSProcessId(),
          tabId: pageIndex,
          timeStamp: Date.now(),
          url: webview.getURL(),
        });
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
        this.onDOMContentLoaded.emit({
          frameId: 0,
          parentFrameId: -1,
          processId: this.getWebView(pageIndex).getWebContents().getOSProcessId(),
          tabId: pageIndex,
          timeStamp: Date.now(),
          url: location,
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
        this.$store.dispatch('didFailLoad', {
          pageIndex,
          isMainFrame: event.isMainFrame,
        });
        const appPath = process.env.NODE_ENV === 'development'
          ? process.cwd()
          : this.$electron.remote.app.getAppPath();
        let errorPage = `file://${appPath}/helper/pages/error/index.html`;
        errorPage += `?ec=${encodeURIComponent(event.errorCode)}`;
        errorPage += `&url=${encodeURIComponent(event.target.getURL())}`;
        if (event.errorCode !== -3 && event.validatedURL === event.target.getURL()) {
          this.getPage(pageIndex).navigateTo(
            `${errorPage}`);
        }
      },
      onIpcMessage(event) {
        if (event.channel === 'newtab') {
          if (this.extensionService.newtabOverrides) {
            event.target.send('newtab', this.extensionService.newtabOverrides);
          } else {
            event.target.send('newtab', this.$store.getters.tabConfig.defaultUrl);
          }
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
        const nav = this.$el.querySelector('#nav');
        nav.style.display = 'block';
        this.getWebView().style.height = `calc(100vh - ${nav.clientHeight}px)`;
      },
      onNewWindow(event, pageIndex) {
        this.onNewTab(event.url, true);
        if (event.disposition === 'new-window' || event.disposition === 'foreground-tab') {
          this.onCreatedNavigationTarget.emit({
            sourceFrameId: 0,
            parentFrameId: -1,
            sourceProcessId: this.getWebView(pageIndex).getWebContents().getOSProcessId(),
            timeStamp: Date.now(),
            url: event.url,
            tabId: this.pages.length - 1,
          });
        }
      },
      onWheel(event) {
        const leftSwipeArrow = document.getElementById('left-swipe-arrow');
        const rightSwipeArrow = document.getElementById('right-swipe-arrow');

        const SWIPE_TRIGGER_DIST = 200;
        const ARROW_OFF_DIST = 200;

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
        this.showDownloadBar = true;
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
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
        const download =
          this.$store.getters.downloads.filter(download => download.startTime === data.startTime);
        if (download.length) {
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
        } else {
          this.showDownloadBar = this.$store.getters.downloads.every(download => download.style === 'hidden')
            ? false
            : this.showDownloadBar;
        }
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

        const ARROW_OFF_DIST = 200;

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
      onContextMenu(event) {
        this.onWebviewContextMenu(event);
      },
      onWillNavigate(event, pageIndex) {
        this.$store.dispatch('clearPageAction', {
          pageIndex,
        });
        this.getPage(pageIndex).onMessageEvent.listeners = [];
        this.onBeforeNavigate.emit({
          frameId: 0,
          parentFrameId: -1,
          processId: this.getWebView(pageIndex).getWebContents().getOSProcessId(),
          tabId: pageIndex,
          timeStamp: Date.now(),
          url: event.url,
        });
      },
      onDidNavigate(event, pageIndex) {
        this.onCompleted.emit({
          frameId: 0,
          parentFrameId: -1,
          processId: this.getWebView(pageIndex).getWebContents().getOSProcessId(),
          tabId: pageIndex,
          timeStamp: Date.now(),
          url: event.url,
        });
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
      onGetLang(event, data) {
        if (this.$electron.remote.webContents.fromId(data.webContentsId)) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          webContents.send('guest-here-your-data', {
            lang: this.$store.getters.lang,
          });
        }
      },
      onSetLang(event, data) {
        this.$store.dispatch('setLang', data.val);
        const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', {
          lang: this.$store.getters.lang,
        });
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
      onNewTab(location, follow = false) {
        this.$store.dispatch('incrementPid');
        if (location) {
          if (location.startsWith('about:')) {
            this.$store.dispatch('createTab', {
              url: urlResource.aboutUrls(location),
              follow: true,
            });
          } else {
            this.$store.dispatch('createTab', {
              url: location,
              follow,
            });
          }
        } else {
          this.$store.dispatch('createTab', {
            url: urlResource.aboutUrls('about:newtab'),
            follow: true,
          });
        }
        this.onCreatedEvent.emit(new Tab(this.currentPageIndex, null));
      },
      onTabDuplicate(pageIndex) {
        this.onNewTab(this.pages[pageIndex].location);
      },
      onTabClick(pageIndex) {
        this.$store.dispatch('clickTab', pageIndex);
      },
      onTabClose(pageIndex) {
        this.onRemovedEvent.emit(new Tab(pageIndex, this.getPage(pageIndex)));
        this.$store.dispatch('closeTab', pageIndex);
        this.$nextTick(() => {
          this.$store.dispatch('setTabsOrder', this.$refs.tabs.sortable.toArray());
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
        const webview = this.getWebView();
        if (webview.getURL() === this.page.location) {
          webview.reload();
        } else {
          webview.loadURL(this.page.location);
        }
      },
      onClickForceRefresh() {
        const webview = this.getWebView();
        if (webview.getURL() === this.page.location) {
          webview.reloadIgnoringCache();
        } else {
          webview.loadURL(this.page.location);
        }
      },
      onClickToggleDevTools() {
        const webview = this.getWebView();
        if (webview.getURL() === this.page.location) {
          webview.openDevTools({ mode: 'bottom' });
        } else {
          webview.loadURL(this.page.location);
        }
      },
      onEnterLocation(location) {
        let newLocation = null;
        if (location.startsWith('about:')) {
          newLocation = urlResource.aboutUrls(location);
        } else if (urlUtil.isNotURL(location)) {
          newLocation = `${this.$store.getters.currentSearchEngine.search}${location}`;
        } else {
          newLocation = location;
        }
        this.getPage().navigateTo(newLocation);
      },
      // onTabContextMenu
      onTabContextMenu(event, pageIndex) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();

        menu.append(new MenuItem({
          label: this.$t('tabs.contextMenu.newTab'),
          accelerator: 'CmdOrCtrl+T',
          click: () => this.onNewTab(),
        }));
        menu.append(new MenuItem({
          label: this.$t('tabs.contextMenu.duplicateTab'),
          click: () => {
            this.onTabDuplicate(pageIndex);
          },
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: this.$t('tabs.contextMenu.closeTab'),
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            this.onTabClose(pageIndex);
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
        const locations = webContents.history;

        const history = this.historyMappings();

        if (current <= locations.length - 1 && current !== 0) {
          for (let i = current - 1; i >= 0; i--) {
            try {
              menu.append(new MenuItem({
                label: history[locations[i]].title,
                click: () => webview.goToIndex(i),
              }));
            } catch (e) {
              menu.append(new MenuItem({
                label: locations[i],
                click: () => webview.goToIndex(i),
              }));
            }
          }

          menu.append(new MenuItem({ type: 'separator' }));
          menu.append(new MenuItem({
            label: this.$t('navbar.navigator.history'),
            click: () => this.onNewTab('about:history'),
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
        const locations = webContents.history;

        const history = this.historyMappings();

        if (current <= locations.length - 1 && current !== locations.length - 1) {
          for (let i = current + 1; i < locations.length; i++) {
            try {
              menu.append(new MenuItem({
                label: history[locations[i]].title,
                click: () => webview.goToIndex(i),
              }));
            } catch (e) {
              menu.append(new MenuItem({
                label: locations[i],
                click: () => webview.goToIndex(i),
              }));
            }
          }

          menu.append(new MenuItem({ type: 'separator' }));
          menu.append(new MenuItem({
            label: this.$t('navbar.navigator.history'),
            click: () => this.onNewTab('about:history'),
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
          label: this.$t('navbar.contextMenu.cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        }));
        menu.append(new MenuItem({
          label: this.$t('navbar.contextMenu.copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        }));
        menu.append(new MenuItem({
          label: this.$t('navbar.contextMenu.paste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        }));
        menu.append(new MenuItem({
          label: this.$t('navbar.contextMenu.pasteAndGo'),
          click: () => {
            let location = el.value.slice(0, el.selectionStart);
            location += clipboard.readText();
            location += el.value.slice(el.selectionEnd);
            this.onEnterLocation(location);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow(), { async: true });
      },
      // onCommonMenu
      onCommonMenu() {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();
        const navbar = document.getElementById('browser-navbar');
        const common = document.getElementById('browser-navbar__common');

        const lastOpenedTabs = [];
        this.lastOpenedTabs().forEach((tab) => {
          lastOpenedTabs.push(new MenuItem({
            label: tab.title,
            click: () => this.onNewTab(tab.url),
          }));
        });

        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.history.title'),
          submenu: [
            new MenuItem({
              label: this.$t('navbar.common.options.history.history'),
              click: () => this.onNewTab('about:history'),
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: '最近關閉的分頁', enabled: false }),
          ].concat(lastOpenedTabs),
        }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.downloads'),
          click: () => this.onNewTab('about:downloads'),
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.extensions'),
          click: () => this.onNewTab('about:extensions'),
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.preferences'),
          click: () => this.onNewTab('about:preferences'),
        }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.help'),
          submenu: [
            new MenuItem({
              label: this.$t('navbar.common.options.lulumi'),
              click: () => this.onNewTab('about:lulumi'),
            }),
          ],
        }));

        menu.popup(this.$electron.remote.getCurrentWindow(), {
          async: true,
          x: Math.floor(common.getBoundingClientRect().right),
          y: Math.floor(navbar.getBoundingClientRect().bottom),
        });
      },
      // onWebviewContextMenu
      onWebviewContextMenu(event) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();
        const clipboard = this.$electron.clipboard;

        const webview = this.getWebView();
        const page = this.getPageObject();

        const registerExtensionContextMenus = (menu) => {
          const contextMenus = JSON.parse(JSON.stringify(this.contextMenus));
          if (contextMenus.length !== 0) {
            menu.append(new MenuItem({ type: 'separator' }));
          }
          Object.keys(contextMenus).forEach((webContentsIdInString) => {
            contextMenus[webContentsIdInString].forEach((menuItems) => {
              menuItems.forEach((menuItem) => {
                if (menuItem.type !== 'separator') {
                  menuItem.label = menuItem.label.replace('%s', event.params.selectionText);
                  menuItem.click = (menuItem, BrowserWindow) => {
                    this.$electron.remote.webContents.fromId(menuItem.webContentsId)
                      .send(`lulumi-context-menus-clicked-${menuItem.extensionId}-${menuItem.id}`,
                        event.params,
                        this.currentPageIndex,
                        menuItem,
                        BrowserWindow,
                      );
                  };
                  const submenu = menuItem.submenu;
                  if (submenu) {
                    submenu.forEach((sub) => {
                      sub.label.replace('%s', event.params.selectionText);
                      sub.click = (menuItem, BrowserWindow) => {
                        this.$electron.remote.webContents.fromId(sub.webContentsId)
                          .send(`lulumi-context-menus-clicked-${sub.extensionId}-${sub.id}`,
                            event.params,
                            this.currentPageIndex,
                            menuItem,
                            BrowserWindow,
                          );
                      };
                    });
                  }
                }
              });
              Menu.buildFromTemplate(menuItems).items
                .forEach(menuItem => menu.append(menuItem));
            });
          });
        };

        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.back'),
          click: () => {
            this.onClickBack();
          },
          enabled: page.canGoBack,
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.forward'),
          click: () => {
            this.onClickForward();
          },
          enabled: page.canGoForward,
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.reload'),
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            this.onClickRefresh();
          },
          enabled: page.canRefresh,
        }));

        if (event.params.editFlags.canUndo) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.undo'),
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo',
          }));
        }

        if (event.params.editFlags.canRedo) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.redo'),
            accelerator: 'CmdOrCtrl+Shift+Z',
            role: 'redo',
          }));
        }

        menu.append(new MenuItem({ type: 'separator' }));

        if (event.params.editFlags.canCut) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.cut'),
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          }));
        }

        if (event.params.editFlags.canCopy) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.copy'),
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          }));
        }

        if (event.params.editFlags.canPaste) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.paste'),
            accelerator: 'CmdOrCtrl+V',
            role: 'paste',
          }));
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.pasteAndMatchStyle'),
            accelerator: 'CmdOrCtrl+Shift+V',
            role: 'pasteandmatchstyle',
          }));
        }

        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.selectAll'),
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        }));
        menu.append(new MenuItem({ type: 'separator' }));

        if (event.params.linkURL) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.openLinkInNewTab'),
            click: () => this.onNewTab(event.params.linkURL),
          }));
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.copyLinkAddress'),
            click: () => {
              clipboard.writeText(event.params.linkURL);
            },
          }));
        }

        if (event.params.hasImageContents) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.saveImageAs'),
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
                    }, async (filename) => {
                      if (filename) {
                        const dataURL = await imageUtil.getBase64FromImageUrl(event.params.srcURL);
                        fs.writeFileSync(
                          filename, electron.nativeImage.createFromDataURL(dataURL).toPNG());
                      }
                    },
                  );
                },
              );
            },
          }));
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.copyImageUrl'),
            click: () => {
              clipboard.writeText(event.params.srcURL);
            },
          }));
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.openImageInNewTab'),
            click: () => this.onNewTab(event.params.srcURL),
          }));
        }

        menu.append(new MenuItem({ type: 'separator' }));
        if (event.params.selectionText) {
          if (event.params.editFlags.canCopy) {
            menu.append(new MenuItem({
              label: this.$t('webview.contextMenu.searchFor', {
                selectionText: event.params.selectionText,
                searchEngine: this.$store.getters.currentSearchEngine.name,
              }),
              click: () => this.onNewTab(event.params.selectionText),
            }));
          }
        }
        const macOS = /^darwin/.test(process.platform);
        if (macOS) {
          if (event.params.selectionText) {
            menu.append(new MenuItem({
              label: this.$t('webview.contextMenu.lookUp', { selectionText: event.params.selectionText }),
              click: () => {
                webview.showDefinitionForSelection();
              },
            }));
          }
        }

        // lulumi.contextMenus
        registerExtensionContextMenus(menu);

        menu.append(new MenuItem({ type: 'separator' }));
        const sourceLocation = urlUtil.getViewSourceUrlFromUrl(this.getPageObject().location);
        if (sourceLocation !== null) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.viewSource'),
            accelerator: 'Shift+CmdOrCtrl+U',
            click: () => this.onNewTab(sourceLocation, true),
          }));
        }
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.inspectElement'),
          click: () => {
            webview.inspectElement(event.params.x, event.params.y);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow(), { async: true });
      },
    },
    beforeMount() {
      const ipc = this.$electron.ipcRenderer;
      const webFrame = this.$electron.webFrame;

      webFrame.setVisualZoomLevelLimits(1, 1);
      ipc.on('set-app-state', (event, newState) => {
        if (newState && Object.keys(newState).length !== 0) {
          this.$store.dispatch('setAppState', newState);
        } else {
          this.onNewTab('about:newtab');
        }
      });
    },
    mounted() {
      const ipc = this.$electron.ipcRenderer;

      if (window.process.platform === 'darwin') {
        document.body.classList.add('darwin');
      }

      ipc.on('browser-window-focus', () => {
        this.onActivatedEvent.emit({
          tabId: this.currentPageIndex,
          windowId: 0,
        });
      });

      ipc.on('startFindInPage', () => {
        this.getPage(this.currentPageIndex).findInPage();
      });

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
      ipc.on('get-lang', (event, data) => {
        if (this.onGetLang) {
          this.onGetLang(event, data);
        }
      });
      ipc.on('set-lang', (event, val) => {
        if (this.onSetLang) {
          this.onSetLang(event, val);
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
        const newPages = tabsOrdering(this.pages, this.$refs.tabs, newStart, this.tabsOrder);
        const newCurrentPageIndex = this.tabsOrder.indexOf(this.currentPageIndex) === -1
          ? this.currentPageIndex
          : this.tabsOrder.indexOf(this.currentPageIndex);
        const downloads = this.$store.getters.downloads;
        const pendingDownloads = downloads.filter(download => download.state === 'progressing');

        if (pendingDownloads.length !== 0) {
          if (force) {
            responseNewState(
              this.$store.getters,
              newStart,
              newPages,
              newCurrentPageIndex,
              downloads.filter(download => download.state !== 'progressing'),
            );
          } else {
            this.$electron.remote.dialog.showMessageBox({
              type: 'warning',
              title: 'Warning',
              message: 'You still have some files progressing.',
              buttons: ['Abort and Leave', 'Cancel'],
            }, (index) => {
              if (index === 0) {
                pendingDownloads.forEach((download) => {
                  this.$electron.ipcRenderer.send('cancel-downloads-progress', download.startTime);
                });
                responseNewState(
                  this.$store.getters,
                  newStart,
                  newPages,
                  newCurrentPageIndex,
                  this.$store.getters.downloads,
                );
              }
            });
          }
        } else {
          responseNewState(
            this.$store.getters,
            newStart,
            newPages,
            newCurrentPageIndex,
            downloads,
          );
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

      // https://github.com/electron/electron/blob/master/docs/tutorial/online-offline-events.md
      const updateOnlineStatus = () => {
        ipc.send('online-status-changed', navigator.onLine);
      };

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      updateOnlineStatus();

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
