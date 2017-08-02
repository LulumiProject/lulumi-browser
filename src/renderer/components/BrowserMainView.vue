<template lang="pug">
  div
    #nav
      tabs(ref="tabs")
      navbar(ref="navbar")
    swipeArrow
    page(v-for="(page, index) in pages",
        :isActive="index === currentPageIndex",
        :pageIndex="index",
        :ref="`page-${index}`",
        :key="`page-${page.pid}`",
        :partitionId="`${page.pid}`")
    #footer
      transition(name="extend")
        .browser-page-status(v-show="page.statusText") {{ page.statusText }}
      download(v-show="$store.getters.downloads.length !== 0 && showDownloadBar")
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import url from 'url';

  import Tabs from './BrowserMainView/Tabs.vue';
  import Navbar from './BrowserMainView/Navbar.vue';
  import swipeArrow from './BrowserMainView/SwipeArrow.vue';
  import Page from './BrowserMainView/Page.vue';
  import Download from './BrowserMainView/Download.vue';

  import urlUtil from '../js/lib/url-util';
  import imageUtil from '../js/lib/image-util';
  import urlResource from '../js/lib/url-resource';
  import tabsOrdering from '../js/lib/tabs-ordering';
  import responseNewState from '../js/lib/response-new-state';

  import ExtensionService from '../../api/extension-service';
  import Event from '../../api/extensions/event';

  import { browserMainView, store } from 'lulumi';

  @Component({
    name: 'browser-main',
    components: {
      Tabs,
      Navbar,
      swipeArrow,
      Page,
      Download,
    },
  })
  export default class BrowserMainView extends Vue {
    dummyPageObject: store.PageObject = {
      pid: -1,
      location: '',
      statusText: false,
      favicon: null,
      title: null,
      isLoading: false,
      isSearching: false,
      canGoBack: false,
      canGoForward: false,
      canRefresh: false,
      error: false,
      hasMedia: false,
      isAudioMuted: false,
      pageActionMapping: {},
    };
    trackingFingers: boolean = false;
    swipeGesture: boolean = false;
    isSwipeOnEdge: boolean = false;
    deltaX: number = 0;
    deltaY: number = 0;
    hnorm: number = 0;
    startTime: number = 0;
    showDownloadBar: boolean = false;
    extensionService: ExtensionService;
    contextMenus: object = {};
    onUpdatedEvent: Event = new Event();
    onCreatedEvent: Event = new Event();
    onRemovedEvent: Event = new Event();
    alarms: browserMainView.AlarmArray = {};
    onActivatedEvent: Event = new Event();
    onAlarmEvent: Event = new Event();
    onBeforeNavigate: Event = new Event();
    onCreatedNavigationTarget: Event = new Event();
    onCommitted: Event = new Event();
    onCompleted: Event = new Event();
    onDOMContentLoaded: Event = new Event();

    get page(): store.PageObject {
      if (this.$store.getters.pages.length === 0) {
        return this.dummyPageObject;
      }
      return this.$store.getters.pages[this.$store.getters.currentPageIndex];
    }
    get pages(): Array<store.PageObject> {
      return this.$store.getters.pages;
    }
    get tabsOrder(): Array<number> {
      return this.$store.getters.tabsOrder;
    }
    get currentPageIndex(): number {
      return this.$store.getters.currentPageIndex;
    }
    get homepage(): string {
      return this.$store.getters.homepage;
    }
    get pdfViewer(): string {
      return this.$store.getters.pdfViewer;
    }

    getWebView(i?: number): Electron.WebviewTag {
      const index: number = (i === undefined) ? this.$store.getters.currentPageIndex : i;
      return this.$refs[`page-${index}`][0].$refs.webview;
    }
    getPage(i?: number): Page {
      const index: number = (i === undefined) ? this.$store.getters.currentPageIndex : i;
      return this.$refs[`page-${index}`][0];
    }
    getPageObject(i?: number): store.PageObject {
      const index: number = (i === undefined) ? this.$store.getters.currentPageIndex : i;
      return this.$store.getters.pages[index];
    }
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
    }
    lastOpenedTabs(): browserMainView.LastOpenedTabObject[] {
      return this.$store.getters.lastOpenedTabs.slice(0, 8);
    }
    // lulumi.alarms
    getAlarm(name): browserMainView.Alarm | undefined {
      return this.alarms[name];
    }
    getAllAlarm(): browserMainView.AlarmArray {
      return this.alarms;
    }
    clearAlarm(name: string): boolean {
      const alarm = this.getAlarm(name);
      if (alarm) {
        if (alarm.handler) {
          if (alarm.periodInMinutes) {
            clearInterval(alarm.handler);
          } else {
            clearTimeout(alarm.handler);
          }
        }
        Vue.delete(this.alarms, name);
        return true;
      }
      return false;
    }
    clearAllAlarm(): void {
      Object.keys(this.getAllAlarm()).forEach(name => (this.clearAlarm(name)));
      this.alarms = {};
    }
    createAlarm(name: string, alarmInfo): void {
      let alarm: browserMainView.Alarm = {
        handler: () => {},
      };
      let timeout;

      this.clearAlarm(name);

      if (alarmInfo.when) {
        timeout = alarmInfo.when - Date.now();
      } else if (alarmInfo.delayInMinutes) {
        timeout = alarmInfo.delayInMinutes * 60 * 1000;
      }
      if (alarmInfo.periodInMinutes) {
        alarm.handler
          = setInterval(() => this.onAlarmEvent.emit(this.getAlarm(name)), timeout);
        alarm.periodInMinutes = alarmInfo.periodInMinutes;
      } else {
        alarm.handler
          = setTimeout(() => this.onAlarmEvent.emit(this.getAlarm(name)), timeout);
      }
      Vue.set(this.alarms, name, alarm);
    }
    addContextMenus(menuItems, webContentsId: number): void {
      this.contextMenus[`'${webContentsId}'`] = [menuItems];
    }
    // pageHandlers
    onLoadCommit(event: Electron.LoadCommitEvent, pageIndex: number): void {
      if (event.isMainFrame) {
        const navbar = this.$refs.navbar;
        (navbar as any).showLocation(event.url);
      }
    }
    onDidFrameFinishLoad(event: Electron.DidFrameFinishLoadEvent, pageIndex: number): void {
      if (event.isMainFrame) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('didFrameFinishLoad', {
          pageIndex,
          webview,
        });
      }
    }
    onDidStartLoading(event: Electron.Event, pageIndex: number): void {
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
    }
    onDomReady(event: Electron.Event, pageIndex: number): void {
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
          webview.getWebContents().downloadURL(parsedURL.query.src);
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
    }
    onDidStopLoading(event: Electron.Event, pageIndex: number): void {
      const webview = this.getWebView(pageIndex);
      this.$store.dispatch('didStopLoading', {
        pageIndex,
        webview,
      });
    }
    onDidFailLoad(event, pageIndex: number): void {
      this.$store.dispatch('didFailLoad', {
        pageIndex,
        isMainFrame: (event as Electron.DidFailLoadEvent).isMainFrame,
      });
      const appPath = process.env.NODE_ENV === 'development'
        ? process.cwd()
        : (this as any).$electron.remote.app.getAppPath();
      let errorPage = `file://${appPath}/helper/pages/error/index.html`;
      errorPage += `?ec=${encodeURIComponent(event.errorCode)}`;
      errorPage += `&url=${encodeURIComponent(event.target.getURL())}`;
      if (event.errorCode !== -3 && event.validatedURL === event.target.getURL()) {
        this.getPage(pageIndex).navigateTo(
          `${errorPage}`);
      }
    }
    onIpcMessage(event: Electron.IpcMessageEvent): void {
      if (event.channel === 'newtab') {
        if (this.extensionService.newtabOverrides !== '') {
          (event.target as any).send('newtab', this.extensionService.newtabOverrides);
        } else {
          (event.target as any).send('newtab', this.$store.getters.tabConfig.defaultUrl);
        }
      }
    }
    onPageTitleSet(event: Electron.PageTitleUpdatedEvent, pageIndex: number): void {
      const webview = this.getWebView(pageIndex);
      this.$store.dispatch('pageTitleSet', {
        pageIndex,
        webview,
      });
    }
    onUpdateTargetUrl(event: Electron.UpdateTargetUrlEvent, pageIndex: number): void {
      this.$store.dispatch('updateTargetUrl', {
        pageIndex,
        url: event.url,
      });
    }
    onMediaStartedPlaying(event: Electron.Event, pageIndex: number): void {
      const webview = this.getWebView(pageIndex);
      this.$store.dispatch('mediaStartedPlaying', {
        pageIndex,
        webview,
      });
    }
    onMediaPaused(event: Electron.Event, pageIndex: number): void {
      this.$store.dispatch('mediaPaused', pageIndex);
    }
    onToggleAudio(event: Electron.Event, pageIndex: number, muted: boolean): void {
      this.getWebView(pageIndex).setAudioMuted(muted);
      this.$store.dispatch('toggleAudio', {
        pageIndex,
        muted,
      });
    }
    onPageFaviconUpdated(event: Electron.PageFaviconUpdatedEvent, pageIndex: number): void {
      this.$store.dispatch('pageFaviconUpdated', {
        pageIndex,
        url: event.favicons[0],
      });
    }
    onEnterHtmlFullScreen(): void {
      (this.$el.querySelector('#nav') as any).style.display = 'none';
      this.getWebView().style.height = '100vh';
    }
    onLeaveHtmlFullScreen(): void {
      const nav: any = this.$el.querySelector('#nav');
      nav.style.display = 'block';
      this.getWebView().style.height = `calc(100vh - ${nav.clientHeight}px)`;
    }
    onNewWindow(event: Electron.NewWindowEvent, pageIndex: number): void {
      this.onNewTab(event.url, true);
      if (event.disposition === 'new-window' || event.disposition === 'foreground-tab') {
        this.onCreatedNavigationTarget.emit({
          sourceTabId: pageIndex,
          sourceProcessId: this.getWebView(pageIndex).getWebContents().getOSProcessId(),
          sourceFrameId: 0,
          timeStamp: Date.now(),
          url: event.url,
          tabId: this.pages.length - 1,
        });
      }
    }
    onWheel(event: WheelEvent): void {
      const leftSwipeArrow = document.getElementById('left-swipe-arrow');
      const rightSwipeArrow = document.getElementById('right-swipe-arrow');

      const SWIPE_TRIGGER_DIST = 200;
      const ARROW_OFF_DIST = 200;

      if (leftSwipeArrow !== null && rightSwipeArrow !== null) {
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
      }
    }
    onOpenPDF(event: Electron.Event, data): void {
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
        const webview = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
        if (this.pdfViewer === 'pdf-viewer') {
          const parsedURL = url.parse(data.location, true);
          webview.downloadURL(`${parsedURL.query.file}?skip=true`);
        } else {
          webview.loadURL(data.location);
        }
      }
    }
    onWillDownloadAnyFile(event: Electron.Event, data): void {
      this.showDownloadBar = true;
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
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
    }
    onUpdateDownloadsProgress(event: Electron.Event, data): void {
      this.$store.dispatch('updateDownloadsProgress', {
        startTime: data.startTime,
        getReceivedBytes: data.getReceivedBytes,
        savePath: data.savePath,
        isPaused: data.isPaused,
        canResume: data.canResume,
        state: data.state,
      });
    }
    onCompleteDownloadsProgress(event: Electron.Event, data): void {
      this.$store.dispatch('completeDownloadsProgress', {
        name: data.name,
        startTime: data.startTime,
        state: data.state,
      });
      const download =
        this.$store.getters.downloads.filter(download => download.startTime === data.startTime);
      if (download.length) {
        let option: any;
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
        new Notification(option.title, option);
      } else {
        this.showDownloadBar = this.$store.getters.downloads.every(download => download.style === 'hidden')
          ? false
          : this.showDownloadBar;
      }
    }
    onCloseDownloadBar(): void {
      this.showDownloadBar = false;
      this.$store.dispatch('closeDownloadBar');
    }
    onScrollTouchBegin(event: Electron.Event, swipeGesture: boolean): void {
      if (swipeGesture) {
        this.trackingFingers = true;
        this.isSwipeOnEdge = false;
      }
    }
    onScrollTouchEnd(): void {
      const leftSwipeArrow = document.getElementById('left-swipe-arrow');
      const rightSwipeArrow = document.getElementById('right-swipe-arrow');

      const ARROW_OFF_DIST = 200;

      if (leftSwipeArrow !== null && rightSwipeArrow !== null) {
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
      }
    }
    onScrollTouchEdge(): void {
      this.isSwipeOnEdge = true;
    }
    onContextMenu(event: Electron.Event): void {
      this.onWebviewContextMenu(event);
    }
    onWillNavigate(event: Electron.WillNavigateEvent, pageIndex: number): void {
      this.$store.dispatch('clearPageAction', {
        pageIndex,
      });
      this.getPage(pageIndex).onMessageEvent.listeners = [];
      this.onBeforeNavigate.emit({
        tabId: pageIndex,
        url: event.url,
        frameId: 0,
        parentFrameId: -1,
        timeStamp: Date.now(),
      });
    }
    onDidNavigate(event: Electron.DidNavigateEvent, pageIndex: number): void {
      this.onCompleted.emit({
        frameId: 0,
        parentFrameId: -1,
        processId: this.getWebView(pageIndex).getWebContents().getOSProcessId(),
        tabId: pageIndex,
        timeStamp: Date.now(),
        url: event.url,
      });
    }
    onGetSearchEngineProvider(event: Electron.Event, data): void {
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', {
          searchEngine: this.$store.getters.searchEngine,
          currentSearchEngine: this.$store.getters.currentSearchEngine,
        });
      }
    }
    onSetSearchEngineProvider(event: Electron.Event, data): void {
      this.$store.dispatch('setCurrentSearchEngineProvider', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      webContents.send('guest-here-your-data', {
        searchEngine: this.$store.getters.searchEngine,
        currentSearchEngine: this.$store.getters.currentSearchEngine,
      });
    }
    onGetHomepage(event: Electron.Event, data): void {
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', {
          homepage: this.$store.getters.homepage,
        });
      }
    }
    onSetHomepage(event: Electron.Event, data): void {
      this.$store.dispatch('setHomepage', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      webContents.send('guest-here-your-data', {
        homepage: this.$store.getters.homepage,
      });
    }
    onGetPDFViewer(event: Electron.Event, data): void {
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', {
          pdfViewer: this.$store.getters.pdfViewer,
        });
      }
    }
    onSetPDFViewer(event: Electron.Event, data): void {
      this.$store.dispatch('setPDFViewer', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      webContents.send('guest-here-your-data', {
        pdfViewer: this.$store.getters.pdfViewer,
      });
    }
    onGetTabConfig(event: Electron.Event, data): void {
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
      }
    }
    onSetTabConfig(event: Electron.Event, data): void {
      this.$store.dispatch('setTabConfig', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
    }
    onGetLang(event: Electron.Event, data): void {
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', {
          lang: this.$store.getters.lang,
        });
      }
    }
    onSetLang(event: Electron.Event, data): void {
      this.$store.dispatch('setLang', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      webContents.send('guest-here-your-data', {
        lang: this.$store.getters.lang,
      });
    }
    onGetDownloads(event: Electron.Event, data): void {
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.downloads);
      }
    }
    onSetDownloads(event: Electron.Event, data): void {
      this.$store.dispatch('setDownloads', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      webContents.send('guest-here-your-data', this.$store.getters.downloads);
    }
    onGetHistory(event: Electron.Event, data): void {
      if ((this as any).$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.history);
      }
    }
    onSetHistory(event: Electron.Event, data): void {
      this.$store.dispatch('setHistory', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      webContents.send('guest-here-your-data', this.$store.getters.history);
    }
    // tabHandlers
    onNewTab(location: string, follow = false): void {
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
      }
      this.onCreatedEvent.emit(this.extensionService.getTab(this.currentPageIndex));
    }
    onTabDuplicate(pageIndex: number): void {
      this.onNewTab(this.pages[pageIndex].location);
    }
    onTabClick(pageIndex: number): void {
      this.$store.dispatch('clickTab', pageIndex);
    }
    onTabClose(pageIndex: number): void {
      this.onRemovedEvent.emit(this.extensionService.getTab(pageIndex, true).id, {
        windowId: 0,
        isWindowClosing: false,
      });
      this.$store.dispatch('closeTab', pageIndex);
      this.$nextTick(() => {
        this.$store.dispatch('setTabsOrder', (this.$refs.tabs as Tabs).sortable.toArray());
      });
    }
    // navHandlers
    onClickHome(): void {
      this.getPage().navigateTo(this.homepage);
    }
    onClickBack(): void {
      if (this.getPageObject().error) {
        this.getWebView().goToOffset(-2);
      } else {
        this.getWebView().goBack();
      }
    }
    onClickForward(): void {
      this.getWebView().goForward();
    }
    onClickStop(): void {
      this.getWebView().stop();
    }
    onClickRefresh(): void {
      const webview = this.getWebView();
      if (webview.getURL() === this.page.location) {
        webview.reload();
      } else {
        webview.loadURL(this.page.location);
      }
    }
    onClickForceRefresh(): void {
      const webview = this.getWebView();
      if (webview.getURL() === this.page.location) {
        webview.reloadIgnoringCache();
      } else {
        webview.loadURL(this.page.location);
      }
    }
    onClickViewSource(): void {
      const webview = this.getWebView();
      if (webview.getURL() === this.page.location) {
        const sourceLocation = urlUtil.getViewSourceUrlFromUrl(this.getPageObject().location);
        if (sourceLocation !== null) {
          this.onNewTab(sourceLocation, true);
        }
      }
    }
    onClickToggleDevTools(): void {
      const webview = this.getWebView();
      if (webview.getURL() === this.page.location) {
        webview.getWebContents().openDevTools({ mode: 'bottom' });
      } else {
        webview.loadURL(this.page.location);
      }
    }
    onEnterLocation(location: string): void {
      let newLocation: string;
      if (location.startsWith('about:')) {
        newLocation = urlResource.aboutUrls(location);
      } else if (urlUtil.isNotURL(location)) {
        newLocation = `${this.$store.getters.currentSearchEngine.search}${location}`;
      } else {
        newLocation = location;
      }
      this.getPage().navigateTo(newLocation);
    }
    // onTabContextMenu
    onTabContextMenu(event: Electron.Event, pageIndex: number): void {
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();

      menu.append(new MenuItem({
        label: this.$t('tabs.contextMenu.newTab'),
        accelerator: 'CmdOrCtrl+T',
        click: () => this.onNewTab('about:newtab'),
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

      menu.popup((this as any).$electron.remote.getCurrentWindow(), { async: true });
    }
    // onClickBackContextMenu
    onClickBackContextMenu(): void {
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const webview = this.getWebView();
      const webContents: any = webview.getWebContents();
      const navbar = document.getElementById('browser-navbar');
      const goBack = document.getElementById('browser-navbar__goBack');

      const current = webContents.getActiveIndex();
      const locations = webContents.history;

      const history = this.historyMappings();

      if (goBack !== null && navbar !== null) {
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

          menu.popup((this as any).$electron.remote.getCurrentWindow(), {
            async: true,
            x: Math.floor(goBack.getBoundingClientRect().left),
            y: Math.floor(navbar.getBoundingClientRect().bottom),
          });
        }
      }
    }
    // onClickForwardContextMenu
    onClickForwardContextMenu(): void {
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const webview = this.getWebView();
      const webContents: any = webview.getWebContents();
      const navbar = document.getElementById('browser-navbar');
      const goForward = document.getElementById('browser-navbar__goForward');

      const current = webContents.getActiveIndex();
      const locations = webContents.history;

      const history = this.historyMappings();

      if (goForward !== null && navbar !== null) {
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

          menu.popup((this as any).$electron.remote.getCurrentWindow(), {
            async: true,
            x: Math.floor(goForward.getBoundingClientRect().left),
            y: Math.floor(navbar.getBoundingClientRect().bottom),
          });
        }
      }
    }
    // onNavContextMenu
    onNavContextMenu(event: Electron.Event): void {
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const el = event.target as HTMLInputElement;
      const clipboard = (this as any).$electron.clipboard;

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

      menu.popup((this as any).$electron.remote.getCurrentWindow(), { async: true });
    }
    // onCommonMenu
    onCommonMenu(): void {
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const navbar = document.getElementById('browser-navbar');
      const common = document.getElementById('browser-navbar__common');

      if (navbar !== null && common !== null) {
        const lastOpenedTabs: store.LastOpenedTabObject[] = [];
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

        menu.popup((this as any).$electron.remote.getCurrentWindow(), {
          async: true,
          x: Math.floor(common.getBoundingClientRect().right),
          y: Math.floor(navbar.getBoundingClientRect().bottom),
        });
      }
    }
    // onWebviewContextMenu
    onWebviewContextMenu(event: Electron.Event): void {
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const clipboard = (this as any).$electron.clipboard;

      const webview = this.getWebView();
      const page = this.getPageObject();
      const params: Electron.ContextMenuParams = (event as any).params;

      const registerExtensionContextMenus = (menu) => {
        const contextMenus = JSON.parse(JSON.stringify(this.contextMenus));
        if (contextMenus.length !== 0) {
          menu.append(new MenuItem({ type: 'separator' }));
        }
        Object.keys(contextMenus).forEach((webContentsIdInString) => {
          contextMenus[webContentsIdInString].forEach((menuItems) => {
            menuItems.forEach((menuItem) => {
              if (menuItem.type !== 'separator') {
                menuItem.label = menuItem.label.replace('%s', params.selectionText);
                menuItem.click = (menuItem, BrowserWindow) => {
                  (this as any).$electron.remote.webContents.fromId(menuItem.webContentsId)
                    .send(`lulumi-context-menus-clicked-${menuItem.extensionId}-${menuItem.id}`,
                      params,
                      this.currentPageIndex,
                      menuItem,
                      BrowserWindow,
                    );
                };
                const submenu = menuItem.submenu;
                if (submenu) {
                  submenu.forEach((sub) => {
                    sub.label.replace('%s', params.selectionText);
                    sub.click = (menuItem, BrowserWindow) => {
                      (this as any).$electron.remote.webContents.fromId(sub.webContentsId)
                        .send(`lulumi-context-menus-clicked-${sub.extensionId}-${sub.id}`,
                          params,
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

      if (params.editFlags.canUndo) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.undo'),
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        }));
      }

      if (params.editFlags.canRedo) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.redo'),
          accelerator: 'CmdOrCtrl+Shift+Z',
          role: 'redo',
        }));
      }

      menu.append(new MenuItem({ type: 'separator' }));

      if (params.editFlags.canCut) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        }));
      }

      if (params.editFlags.canCopy) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        }));
      }

      if (params.editFlags.canPaste) {
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

      if (params.linkURL) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.openLinkInNewTab'),
          click: () => this.onNewTab(params.linkURL),
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.copyLinkAddress'),
          click: () => {
            clipboard.writeText(params.linkURL);
          },
        }));
      }

      if (params.hasImageContents) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.saveImageAs'),
          click: () => {
            const fs = require('fs');
            const path = require('path');
            const electron = (this as any).$electron;
            urlUtil.getFilenameFromUrl(params.srcURL).then(
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
                      const dataURL = await imageUtil.getBase64FromImageUrl(params.srcURL);
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
            clipboard.writeText(params.srcURL);
          },
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.openImageInNewTab'),
          click: () => this.onNewTab(params.srcURL),
        }));
      }

      menu.append(new MenuItem({ type: 'separator' }));
      if (params.selectionText) {
        if (params.editFlags.canCopy) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.searchFor', {
              selectionText: params.selectionText,
              searchEngine: this.$store.getters.currentSearchEngine.name,
            }),
            click: () => this.onNewTab(params.selectionText),
          }));
        }
      }
      const macOS = /^darwin/.test(process.platform);
      if (macOS) {
        if (params.selectionText) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.lookUp', { selectionText: params.selectionText }),
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
          accelerator: process.platform === 'darwin' ? 'Alt+Command+U' : 'Ctrl+Shift+U',
          click: () => this.onNewTab(sourceLocation, true),
        }));
      }
      menu.append(new MenuItem({
        label: this.$t('webview.contextMenu.inspectElement'),
        click: () => {
          webview.inspectElement(params.x, params.y);
        },
      }));

      menu.popup((this as any).$electron.remote.getCurrentWindow(), { async: true });
    }

    beforeMount() {
      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;
      const webFrame: Electron.WebFrame = (this as any).$electron.webFrame;

      webFrame.setVisualZoomLevelLimits(1, 1);
      ipc.on('set-app-state', (event, newState) => {
        if (newState && newState.pages.length !== 0) {
          this.$store.dispatch('setAppState', newState);
        } else {
          this.onNewTab('about:newtab');
        }
      });
    }
    mounted() {
      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;

      if (process.platform === 'darwin') {
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
            (this as any).$electron.remote.dialog.showMessageBox({
              type: 'warning',
              title: 'Warning',
              message: 'You still have some files progressing.',
              buttons: ['Abort and Leave', 'Cancel'],
            }, (index) => {
              if (index === 0) {
                pendingDownloads.forEach((download) => {
                  (this as any).$electron.ipcRenderer.send('cancel-downloads-progress', download.startTime);
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
      ipc.on('scroll-touch-end', () => {
        if (this.onScrollTouchEnd) {
          this.onScrollTouchEnd();
        }
      });
      ipc.on('scroll-touch-edge', () => {
        if (this.onScrollTouchEdge) {
          this.onScrollTouchEdge();
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
    }
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
