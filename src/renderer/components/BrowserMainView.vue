<template lang="pug">
  div
    #nav
      tabs(ref="tabs", :windowId="windowId")
      navbar(ref="navbar", :windowId="windowId")
    swipeArrow
    page(v-for="(page, index) in pages",
        :isActive="index === currentTabIndex",
        :windowId="windowId",
        :tabIndex="index",
        :pageId="page.pid",
        :ref="`page-${index}`",
        :key="`page-${page.pid}`",
        :partitionId="`${page.pid}`")
    #footer
      transition(name="extend")
        .browser-page-status(v-show="page.statusText") {{ decodeURIComponent(page.statusText) }}
      download(v-show="$store.getters.downloads.length !== 0 && showDownloadBar")
</template>

<script lang="ts">
  import { Component, Watch, Vue } from 'vue-property-decorator';

  import url from 'url';

  import Tabs from './BrowserMainView/Tabs.vue';
  import Navbar from './BrowserMainView/Navbar.vue';
  import swipeArrow from './BrowserMainView/SwipeArrow.vue';
  import Page from './BrowserMainView/Page.vue';
  import Download from './BrowserMainView/Download.vue';

  import urlUtil from '../js/lib/url-util';
  import imageUtil from '../js/lib/image-util';
  import urlResource from '../js/lib/url-resource';

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
    windowId: number = 0;
    trackingFingers: boolean = false;
    swipeGesture: boolean = false;
    isSwipeOnEdge: boolean = false;
    deltaX: number = 0;
    deltaY: number = 0;
    hnorm: number = 0;
    startTime: number = 0;
    showDownloadBar: boolean = false;
    extensionService: ExtensionService;
    ready: boolean = false;
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

    get dummyPageObject(): store.PageObject {
      return this.$store.getters.tabConfig.dummyPageObject;
    }
    get currentTabIndex(): number {
      return this.$store.getters.currentTabIndexes[this.windowId];
    }
    get pages(): Array<store.PageObject> {
      return this.$store.getters.pages.filter(page => page.windowId === this.windowId);
    }
    get page(): store.PageObject {
      if (this.pages.length === 0) {
        return this.dummyPageObject;
      }
      return this.pages[this.currentTabIndex];
    }
    get tabsOrder(): Array<number> {
      return this.$store.getters.tabsOrder[this.windowId];
    }
    get homepage(): string {
      return this.$store.getters.homepage;
    }
    get pdfViewer(): string {
      return this.$store.getters.pdfViewer;
    }
    get mappings(): number[] {
      return this.$store.getters.mappings[this.windowId];
    }

    @Watch('ready')
    onReady(ready: boolean): void {
      if (ready) {
        (this as any).$electron.ipcRenderer.send('request-app-state');
      }
    }

    getWebView(i?: number): Electron.WebviewTag {
      const index: number = (i === undefined) ? this.currentTabIndex : i;
      return this.$refs[`page-${index}`][0].$refs.webview;
    }
    getPage(i?: number): Page {
      const index: number = (i === undefined) ? this.currentTabIndex : i;
      return this.$refs[`page-${index}`][0];
    }
    getPageObject(i?: number): store.PageObject {
      const index: number = (i === undefined) ? this.currentTabIndex : i;
      return this.pages[index];
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
    lastOpenedTabs(): store.LastOpenedTabObject[] {
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
    clearAllAlarm(): boolean {
      return Object.keys(this.getAllAlarm()).every(name => (this.clearAlarm(name)));
    }
    createAlarm(name: string, alarmInfo): void {
      let alarm: browserMainView.Alarm = {
        handler: () => {},
      };
      let timeout: number = 0;

      this.clearAlarm(name);

      if (alarmInfo.when) {
        timeout = alarmInfo.when - Date.now();
      } else if (alarmInfo.delayInMinutes) {
        timeout = alarmInfo.delayInMinutes * 60 * 1000;
      } else if (alarmInfo.periodInMinutes) {
        timeout = alarmInfo.periodInMinutes * 60 * 1000;
      }
      if (timeout !== 0) {
        alarm.handler
        = setTimeout(() => this.onAlarmEvent.emit(this.getAlarm(name)), timeout);
        if (alarmInfo.periodInMinutes) {
          timeout = alarmInfo.periodInMinutes * 60 * 1000;
          alarm.handler
            = setInterval(() => this.onAlarmEvent.emit(this.getAlarm(name)), timeout);
          alarm.periodInMinutes = alarmInfo.periodInMinutes;
        }

        Vue.set(this.alarms, name, alarm);
      }
    }
    addContextMenus(menuItems, webContentsId: number): void {
      if (menuItems) {
        if (menuItems.length === 0) {
          Vue.delete((this.contextMenus as any), webContentsId);
        } else {
          this.contextMenus[`'${webContentsId}'`] = [menuItems];
        }
      }
    }
    // pageHandlers
    onDidStartLoading(event: Electron.Event, tabIndex: number, pageId: number): void {
      const webview = this.getWebView(tabIndex);
      this.$store.dispatch('didStartLoading', {
        windowId: this.windowId,
        pageId,
        tabIndex,
        location: webview.getURL(),
      });
      this.$store.dispatch('updateMappings', {
        windowId: this.windowId,
        pageId,
        tabIndex,
        webContentsId: webview.getWebContents().id,
      });
      this.onCommitted.emit({
        frameId: 0,
        parentFrameId: -1,
        processId: this.getWebView(tabIndex).getWebContents().getOSProcessId(),
        tabId: this.getPageObject(tabIndex).pid,
        timeStamp: Date.now(),
        url: webview.getURL(),
      });
    }
    onLoadCommit(event: Electron.LoadCommitEvent, tabIndex: number, pageId: number): void {
      if (event.isMainFrame) {
        const navbar = this.$refs.navbar;
        (navbar as any).showLocation(event.url);
        this.$store.dispatch('loadCommit', {
          windowId: this.windowId,
          pageId,
          tabIndex,
        });
      }
    }
    onPageTitleSet(event: Electron.PageTitleUpdatedEvent, tabIndex: number, pageId: number): void {
      const webview = this.getWebView(tabIndex);
      (this as any).$electron.ipcRenderer.send('set-browser-window-title', {
        windowId: this.windowId,
        title: webview.getTitle(),
      });
      this.$store.dispatch('pageTitleSet', {
        windowId: this.windowId,
        pageId,
        tabIndex,
        title: webview.getTitle(),
      });
    }
    onDomReady(event: Electron.Event, tabIndex: number, pageId: number): void {
      const webview = this.getWebView(tabIndex);
      const location = webview.getURL();
      const parsedURL = url.parse(location, true);
      if (parsedURL.protocol === 'chrome:' && parsedURL.hostname === 'pdf-viewer') {
        if (this.pdfViewer === 'pdf-viewer') {
          this.$store.dispatch('domReady', {
            windowId: this.windowId,
            pageId,
            tabIndex,
            canGoBack: webview.canGoBack(),
            canGoForward: webview.canGoForward(),
          });
        } else {
          webview.getWebContents().downloadURL(parsedURL.query.src);
        }
      } else {
        this.$store.dispatch('domReady', {
          windowId: this.windowId,
          pageId,
          tabIndex,
          canGoBack: webview.canGoBack(),
          canGoForward: webview.canGoForward(),
        });
      }
      this.onDOMContentLoaded.emit({
        frameId: 0,
        parentFrameId: -1,
        processId: this.getWebView(tabIndex).getWebContents().getOSProcessId(),
        tabId: this.getPageObject(tabIndex).pid,
        timeStamp: Date.now(),
        url: location,
      });
    }
    onDidFrameFinishLoad(event: Electron.DidFrameFinishLoadEvent, tabIndex: number, pageId: number): void {
      if (event.isMainFrame) {
        const webview = this.getWebView(tabIndex);
        this.$store.dispatch('didFrameFinishLoad', {
          windowId: this.windowId,
          pageId,
          tabIndex,
          location: webview.getURL(),
          canGoBack: webview.canGoBack(),
          canGoForward: webview.canGoForward(),
        });
      }
    }
    onPageFaviconUpdated(event: Electron.PageFaviconUpdatedEvent, tabIndex: number, pageId: number): void {
      this.$store.dispatch('pageFaviconUpdated', {
        windowId: this.windowId,
        pageId,
        tabIndex,
        location: event.favicons[0],
      });
    }
    onDidStopLoading(event: Electron.Event, tabIndex: number, pageId: number): void {
      const webview = this.getWebView(tabIndex);
      this.$store.dispatch('didStopLoading', {
        windowId: this.windowId,
        pageId,
        tabIndex,
        location: webview.getURL(),
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
      });
    }
    onDidFailLoad(event: Electron.DidFailLoadEvent, tabIndex: number, pageId: number): void {
      this.$store.dispatch('didFailLoad', {
        windowId: this.windowId,
        pageId,
        tabIndex,
        isMainFrame: event.isMainFrame,
      });
      const appPath = process.env.NODE_ENV === 'development'
        ? process.cwd()
        : (this as any).$electron.remote.app.getAppPath();
      let errorPage = `file://${appPath}/helper/pages/error/index.html`;
      errorPage += `?ec=${encodeURIComponent((event as any).errorCode)}`;
      errorPage += `&url=${encodeURIComponent((event as any).target.getURL())}`;
      if ((event as any).errorCode !== -3 && (event as any).validatedURL === (event as any).target.getURL()) {
        this.getPage(tabIndex).navigateTo(
          `${errorPage}`);
      }
    }
    onIpcMessage(event: Electron.IpcMessageEvent): void {
      if (event.channel === 'newtab') {
        if (this.extensionService.newtabOverrides !== '') {
          (event.target as any).send('newtab', this.extensionService.newtabOverrides);
        } else {
          (event.target as any).send('newtab', this.$store.getters.tabConfig.dummyPageObject.location);
        }
      }
    }
    onUpdateTargetUrl(event: Electron.UpdateTargetUrlEvent, tabIndex: number, pageId: number): void {
      this.$store.dispatch('updateTargetUrl', {
        windowId: this.windowId,
        pageId,
        tabIndex,
        location: event.url,
      });
    }
    onMediaStartedPlaying(event: Electron.Event, tabIndex: number, pageId: number): void {
      const webview = this.getWebView(tabIndex);
      this.$store.dispatch('mediaStartedPlaying', {
        windowId: this.windowId,
        pageId,
        tabIndex,
        isAudioMuted: webview.isAudioMuted(),
      });
    }
    onMediaPaused(event: Electron.Event, tabIndex: number, pageId: number): void {
      this.$store.dispatch('mediaPaused', {
        windowId: this.windowId,
        pageId,
        tabIndex,
      });
    }
    onToggleAudio(event: Electron.Event, tabIndex: number, muted: boolean): void {
      this.getWebView(tabIndex).setAudioMuted(muted);
      this.$store.dispatch('toggleAudio', {
        windowId: this.windowId,
        pageId: this.getPageObject(tabIndex).pid,
        tabIndex,
        muted,
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
    onNewWindow(event: Electron.NewWindowEvent, tabIndex: number): void {
      this.onNewTab(this.windowId, event.url, true);
      if (event.disposition === 'new-window' || event.disposition === 'foreground-tab') {
        this.onCreatedNavigationTarget.emit({
          sourceTabId: this.getPageObject(tabIndex).pid,
          sourceProcessId: this.getWebView(tabIndex).getWebContents().getOSProcessId(),
          sourceFrameId: 0,
          timeStamp: Date.now(),
          url: event.url,
          tabId: this.$store.getters.pid,
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
          location: data.url,
          totalBytes: data.totalBytes,
          isPaused: data.isPaused,
          canResume: data.canResume,
          startTime: data.startTime,
          getReceivedBytes: 0,
          dataState: data.dataState,
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
        dataState: data.dataState,
      });
    }
    onCompleteDownloadsProgress(event: Electron.Event, data): void {
      this.$store.dispatch('completeDownloadsProgress', {
        name: data.name,
        startTime: data.startTime,
        dataState: data.dataState,
      });
      const download =
        this.$store.getters.downloads.filter(download => download.startTime === data.startTime);
      if (download.length) {
        let option: any;
        if (data.dataState === 'completed') {
          option = {
            title: 'Success',
            body: `${data.name} download successfully!`,
          };
        } else if (data.dataState === 'cancelled') {
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
    onWillNavigate(event: Electron.WillNavigateEvent, tabIndex: number, pageId: number): void {
      this.$store.dispatch('clearPageAction', {
        windowId: this.windowId,
        pageId,
        tabIndex,
      });
      this.getPage(tabIndex).onMessageEvent.listeners = [];
      this.onBeforeNavigate.emit({
        tabId: this.getPageObject(tabIndex).pid,
        url: event.url,
        frameId: 0,
        parentFrameId: -1,
        timeStamp: Date.now(),
      });
    }
    onDidNavigate(event: Electron.DidNavigateEvent, tabIndex: number): void {
      this.onCompleted.emit({
        frameId: 0,
        parentFrameId: -1,
        processId: this.getWebView(tabIndex).getWebContents().getOSProcessId(),
        tabId: this.getPageObject(tabIndex).pid,
        timeStamp: Date.now(),
        url: event.url,
      });
    }
    onGetSearchEngineProvider(event: Electron.Event, webContentsId: number): void {
      if ((this as any).$electron.remote.webContents.fromId(webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(webContentsId);
        webContents.send('guest-here-your-data', {
          searchEngine: this.$store.getters.searchEngine,
          currentSearchEngine: this.$store.getters.currentSearchEngine,
        });
      }
    }
    onSetSearchEngineProvider(event: Electron.Event, data): void {
      this.$store.dispatch('setCurrentSearchEngineProvider', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      setTimeout(() => {
        webContents.send('guest-here-your-data', {
          searchEngine: this.$store.getters.searchEngine,
          currentSearchEngine: this.$store.getters.currentSearchEngine,
        });
      }, 0);
    }
    onGetHomepage(event: Electron.Event, webContentsId: number): void {
      if ((this as any).$electron.remote.webContents.fromId(webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(webContentsId);
        webContents.send('guest-here-your-data', {
          homepage: this.$store.getters.homepage,
        });
      }
    }
    onSetHomepage(event: Electron.Event, data): void {
      this.$store.dispatch('setHomepage', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      setTimeout(() => {
        webContents.send('guest-here-your-data', {
          homepage: this.$store.getters.homepage,
        });
      }, 0);
    }
    onGetPDFViewer(event: Electron.Event, webContentsId: number): void {
      if ((this as any).$electron.remote.webContents.fromId(webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(webContentsId);
        webContents.send('guest-here-your-data', {
          pdfViewer: this.$store.getters.pdfViewer,
        });
      }
    }
    onSetPDFViewer(event: Electron.Event, data): void {
      this.$store.dispatch('setPDFViewer', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      setTimeout(() => {
        webContents.send('guest-here-your-data', {
          pdfViewer: this.$store.getters.pdfViewer,
        });
      }, 0);
    }
    onGetTabConfig(event: Electron.Event, webContentsId: number): void {
      if ((this as any).$electron.remote.webContents.fromId(webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
      }
    }
    onSetTabConfig(event: Electron.Event, data): void {
      this.$store.dispatch('setTabConfig', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      setTimeout(() => {
        webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
      }, 0);
    }
    onGetLang(event: Electron.Event, webContentsId: number): void {
      if ((this as any).$electron.remote.webContents.fromId(webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(webContentsId);
        webContents.send('guest-here-your-data', {
          lang: this.$store.getters.lang,
        });
      }
    }
    onSetLang(event: Electron.Event, data): void {
      this.$store.dispatch('setLang', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      setTimeout(() => {
        webContents.send('guest-here-your-data', {
          lang: this.$store.getters.lang,
        });
      }, 0);
    }
    onGetDownloads(event: Electron.Event, webContentsId: number): void {
      if ((this as any).$electron.remote.webContents.fromId(webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.downloads);
      }
    }
    onSetDownloads(event: Electron.Event, data): void {
      this.$store.dispatch('setDownloads', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      setTimeout(() => {
        webContents.send('guest-here-your-data', this.$store.getters.downloads);
      }, 0);
    }
    onGetHistory(event: Electron.Event, webContentsId: number): void {
      if ((this as any).$electron.remote.webContents.fromId(webContentsId)) {
        const webContents = (this as any).$electron.remote.webContents.fromId(webContentsId);
        webContents.send('guest-here-your-data', this.$store.getters.history);
      }
    }
    onSetHistory(event: Electron.Event, data): void {
      this.$store.dispatch('setHistory', data.val);
      const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      setTimeout(() => {
        webContents.send('guest-here-your-data', this.$store.getters.history);
      }, 0);
    }
    // tabHandlers
    onNewTab(windowId: number = this.windowId, location: string, follow: boolean = false): void {
      this.$store.dispatch('incrementPid');
      if (location) {
        if (location.startsWith('about:')) {
          this.$store.dispatch('createTab', {
            windowId,
            location: urlResource.aboutUrls(location),
            isURL: true,
            follow: true,
          });
        } else {
          this.$store.dispatch('createTab', {
            windowId,
            location,
            isURL: urlUtil.isURL(location),
            follow,
          });
        }
      }
      const pageObject: store.PageObject = this.getPageObject(this.currentTabIndex);
      if (pageObject) {
        this.extensionService.updateTabs();
        this.onCreatedEvent.emit(this.extensionService.getTab(this.windowId, pageObject.pid));
      }
    }
    onTabDuplicate(tabIndex: number): void {
      this.onNewTab(this.windowId, this.pages[tabIndex].location, true);
    }
    onTabClick(tabIndex: number): void {
      const pageObject: store.PageObject = this.getPageObject(tabIndex);
      const pageId: number = pageObject.pid;
      const pageTitle: string | null = pageObject.title;
      this.$store.dispatch('clickTab', {
        windowId: this.windowId,
        pageId,
        tabIndex,
      });
      if (pageTitle) {
        (this as any).$electron.ipcRenderer.send('set-browser-window-title', {
          windowId: this.windowId,
          title: pageTitle,
        });
      }
    }
    onTabClose(tabIndex: number): void {
      const pageId: number = this.getPageObject(tabIndex).pid;
      this.onRemovedEvent.emit(this.extensionService.getTab(this.windowId, pageId, true).id, {
        windowId: this.windowId,
        isWindowClosing: false,
      });
      this.$store.dispatch('closeTab', {
        windowId: this.windowId,
        pageId,
        tabIndex,
      });
      setTimeout(() => this.$store.dispatch('setTabsOrder', {
        windowId: this.windowId,
        tabsOrder: (this.$refs.tabs as Tabs).sortable.toArray(),
      }), 300);
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
          this.onNewTab(this.windowId, sourceLocation, true);
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
    onTabContextMenu(event: Electron.Event, tabIndex: number): void {
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();

      menu.append(new MenuItem({
        label: this.$t('tabs.contextMenu.newTab'),
        accelerator: 'CmdOrCtrl+T',
        click: () => this.onNewTab(this.windowId, 'about:newtab', false),
      }));
      menu.append(new MenuItem({
        label: this.$t('tabs.contextMenu.duplicateTab'),
        click: () => {
          this.onTabDuplicate(tabIndex);
        },
      }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({
        label: this.$t('tabs.contextMenu.closeTab'),
        accelerator: 'CmdOrCtrl+W',
        click: () => {
          this.onTabClose(tabIndex);
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
            click: () => this.onNewTab(this.windowId, 'about:history', false),
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
            click: () => this.onNewTab(this.windowId, 'about:history', false),
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
            click: () => this.onNewTab(this.windowId, tab.location, false),
          }));
        });

        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.history.title'),
          submenu: [
            new MenuItem({
              label: this.$t('navbar.common.options.history.history'),
              click: () => this.onNewTab(this.windowId, 'about:history', false),
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({ label: '最近關閉的分頁', enabled: false }),
          ].concat(lastOpenedTabs),
        }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.downloads'),
          click: () => this.onNewTab(this.windowId, 'about:downloads', false),
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.extensions'),
          click: () => this.onNewTab(this.windowId, 'about:extensions', false),
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.preferences'),
          click: () => this.onNewTab(this.windowId, 'about:preferences', false),
        }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.help'),
          submenu: [
            new MenuItem({
              label: this.$t('navbar.common.options.lulumi'),
              click: () => this.onNewTab(this.windowId, 'about:lulumi', false),
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
                      this.getPageObject(this.currentTabIndex).pid,
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
                          this.getPageObject(this.currentTabIndex).pid,
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
          click: () => this.onNewTab(this.windowId, params.linkURL, false),
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
          click: () => this.onNewTab(this.windowId, params.srcURL, false),
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
            click: () => this.onNewTab(this.windowId, params.selectionText, false),
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
          click: () => this.onNewTab(this.windowId, sourceLocation, true),
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

      ipc.once('window-close', () => {
        this.$store.dispatch('closeAllTab', this.windowId);
        ipc.send('window-close');
      });

      webFrame.setVisualZoomLevelLimits(1, 1);

      if (process.env.NODE_ENV !== 'testing') {
        this.windowId = ipc.sendSync('window-id');
      } else {
        this.windowId = 0;
      }
      if (this.pages.length === 0) {
        this.onNewTab(this.windowId, 'about:newtab', false);
      }
      this.extensionService = new ExtensionService(this);
    }
    mounted() {
      if (process.platform === 'darwin') {
        document.body.classList.add('darwin');
      }
      // removed unneeded tabs
      this.$store.dispatch('closeAllTab', 0);

      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;

      ipc.on('startFindInPage', () => {
        this.getPage(this.currentTabIndex).findInPage();
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

      ipc.on('get-search-engine-provider', (event: Electron.Event, webContentsId: number) => {
        if (this.onGetSearchEngineProvider) {
          this.onGetSearchEngineProvider(event, webContentsId);
        }
      });
      ipc.on('set-search-engine-provider', (event, val) => {
        if (this.onSetSearchEngineProvider) {
          this.onSetSearchEngineProvider(event, val);
        }
      });
      ipc.on('get-homepage', (event: Electron.Event, webContentsId: number) => {
        if (this.onGetHomepage) {
          this.onGetHomepage(event, webContentsId);
        }
      });
      ipc.on('set-homepage', (event, val) => {
        if (this.onSetHomepage) {
          this.onSetHomepage(event, val);
        }
      });
      ipc.on('get-pdf-viewer', (event: Electron.Event, webContentsId: number) => {
        if (this.onGetPDFViewer) {
          this.onGetPDFViewer(event, webContentsId);
        }
      });
      ipc.on('set-pdf-viewer', (event, val) => {
        if (this.onSetPDFViewer) {
          this.onSetPDFViewer(event, val);
        }
      });
      ipc.on('get-tab-config', (event: Electron.Event, webContentsId: number) => {
        if (this.onGetTabConfig) {
          this.onGetTabConfig(event, webContentsId);
        }
      });
      ipc.on('set-tab-config', (event, val) => {
        if (this.onSetTabConfig) {
          this.onSetTabConfig(event, val);
        }
      });
      ipc.on('get-lang', (event: Electron.Event, webContentsId: number) => {
        if (this.onGetLang) {
          this.onGetLang(event, webContentsId);
        }
      });
      ipc.on('set-lang', (event, val) => {
        if (this.onSetLang) {
          this.onSetLang(event, val);
        }
      });
      ipc.on('get-downloads', (event: Electron.Event, webContentsId: number) => {
        if (this.onGetDownloads) {
          this.onGetDownloads(event, webContentsId);
        }
      });
      ipc.on('set-downloads', (event, val) => {
        if (this.onSetDownloads) {
          this.onSetDownloads(event, val);
        }
      });
      ipc.on('get-history', (event: Electron.Event, webContentsId: number) => {
        if (this.onGetHistory) {
          this.onGetHistory(event, webContentsId);
        }
      });
      ipc.on('set-history', (event, val) => {
        if (this.onSetHistory) {
          this.onSetHistory(event, val);
        }
      });

      ipc.on('about-to-quit', () => {
        const downloads = this.$store.getters.downloads;
        const pendingDownloads = downloads.filter(download => download.state === 'progressing');

        if (pendingDownloads.length !== 0) {
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
              ipc.send('okay-to-quit', true);
            } else {
              ipc.send('okay-to-quit', false);
            }
          });
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
