<template lang="pug">
  div
    #nav(ref="nav")
      tabs(ref="tabs", :windowId="windowId")
      navbar(ref="navbar", :windowId="windowId")
    swipeArrow
    tab(v-for="(tab, index) in tabs",
        :isActive="index === currentTabIndex",
        :windowId="windowId",
        :windowWebContentsId="windowWebContentsId",
        :tabIndex="index",
        :tabId="tab.id",
        :ref="`tab-${index}`",
        :key="`tab-${tab.id}`")
    #footer
      transition(name="extend")
        .browser-tab-status(v-show="tab.statusText") {{ decodeURIComponent(tab.statusText) }}
      download(v-show="$store.getters.downloads.length !== 0 && showDownloadBar")
</template>

<script lang="ts">
  import { Component, Watch, Vue } from 'vue-property-decorator';

  import * as urlPackage from 'url';
  import Worker from 'workerize-loader!../js/worker';

  import Tabs from './BrowserMainView/Tabs.vue';
  import Navbar from './BrowserMainView/Navbar.vue';
  import swipeArrow from './BrowserMainView/SwipeArrow.vue';
  import Tab from './BrowserMainView/Tab.vue';
  import Download from './BrowserMainView/Download.vue';

  import { is } from 'electron-util';
  import urlUtil from '../js/lib/url-util';
  import imageUtil from '../js/lib/image-util';
  import urlResource from '../js/lib/url-resource';

  import ExtensionService from '../../api/extension-service';
  import Event from '../../api/extensions/event';

  import { browserMainView, main, store } from 'lulumi';

  @Component({
    name: 'browser-main',
    components: {
      Tabs,
      Navbar,
      swipeArrow,
      Tab,
      Download,
    },
  })
  export default class BrowserMainView extends Vue {
    windowId: number = 0;
    windowWebContentsId: number = 0;
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
    onCommandEvent: Event = new Event();
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

    worker = new Worker();

    get dummyTabObject(): store.TabObject {
      return this.$store.getters.tabConfig.dummyTabObject;
    }
    get window(): store.LulumiBrowserWindowProperty {
      return this.$store.getters.windows.find(window => window.id === this.windowId);
    }
    get currentTabIndex(): number | undefined {
      return this.$store.getters.currentTabIndexes[this.windowId];
    }
    get tabs(): Array<store.TabObject> {
      return this.$store.getters.tabs.filter(tab => tab.windowId === this.windowId);
    }
    get tab(): store.TabObject {
      if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
        return this.dummyTabObject;
      }
      return this.tabs[this.currentTabIndex];
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
    get certificates(): store.Certificates {
      return this.$store.getters.certificates;
    }

    @Watch('ready')
    onReady(ready: boolean): void {
      if (ready) {
        (this as any).$electron.ipcRenderer.send('request-app-state');
      }
    }

    getWebView(tabIndex?: number): Electron.WebviewTag {
      let index: number | undefined = tabIndex;
      if (index === undefined) {
        if (this.currentTabIndex === undefined) {
          index = 0;
        } else {
          index = this.currentTabIndex;
        }
      }
      return this.$refs[`tab-${index}`][0].$refs.webview;
    }
    getTab(tabIndex?: number): Tab {
      let index: number | undefined = tabIndex;
      if (index === undefined) {
        if (this.currentTabIndex === undefined) {
          index = 0;
        } else {
          index = this.currentTabIndex;
        }
      }
      return this.$refs[`tab-${index}`][0];
    }
    getTabObject(tabIndex?: number): store.TabObject {
      let index: number | undefined = tabIndex;
      if (index === undefined) {
        if (this.currentTabIndex === undefined) {
          index = 0;
        } else {
          index = this.currentTabIndex;
        }
      }
      return this.tabs[index];
    }
    async historyMappings() {
      const history: store.TabHistory[] = this.$store.getters.history;
      let out: any;

      out = await this.worker.historyMappings(history);
      return out;
    }
    lastOpenedTabs(): store.LastOpenedTabObject[] {
      const tabs: store.LastOpenedTabObject[] = this.$store.getters.lastOpenedTabs.slice(0, 8);
      const lastOpenedTabs: store.LastOpenedTabObject[] = [];
      tabs.forEach((tab) => {
        switch (tab.title) {
          case 'about:about':
            lastOpenedTabs.push({
              favIconUrl: tab.favIconUrl,
              title: this.$t('lulumi.aboutPage.title'),
              url: tab.url,
            });
            break;
          case 'about:lulumi':
            lastOpenedTabs.push({
              favIconUrl: tab.favIconUrl,
              title: this.$t('lulumi.lulumiPage.title'),
              url: tab.url,
            });
            break;
          case 'about:preferences':
            lastOpenedTabs.push({
              favIconUrl: tab.favIconUrl,
              title: this.$t('lulumi.preferencesPage.title'),
              url: tab.url,
            });
            break;
          case 'about:downloads':
            lastOpenedTabs.push({
              favIconUrl: tab.favIconUrl,
              title: this.$t('lulumi.downloadsPage.title'),
              url: tab.url,
            });
            break;
          case 'about:history':
            lastOpenedTabs.push({
              favIconUrl: tab.favIconUrl,
              title: this.$t('lulumi.historyPage.title'),
              url: tab.url,
            });
            break;
          case 'about:extensions':
            lastOpenedTabs.push({
              favIconUrl: tab.favIconUrl,
              title: this.$t('lulumi.extensionsPage.title'),
              url: tab.url,
            });
            break;
          default:
            lastOpenedTabs.push({
              favIconUrl: tab.favIconUrl,
              title: tab.title,
              url: tab.url,
            });
            break;
        }
      });
      return lastOpenedTabs;
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
    // tabHandlers
    onDidStartLoading(event: Electron.Event, tabIndex: number, tabId: number): void {
      const webview = this.getWebView(tabIndex);
      this.$store.dispatch('didStartLoading', {
        webContentsId: webview.getWebContents().id,
        windowId: this.windowId,
        tabId,
        tabIndex,
        url: webview.getAttribute('src'),
      });
      if ((process.env.NODE_ENV !== 'testing')) {
        this.onUpdatedEvent.emit(tabId, {
          url: webview.getAttribute('src'),
        },
        this.getTabObject(tabIndex));
      }
      this.onCommitted.emit({
        frameId: 0,
        parentFrameId: -1,
        processId: this.getWebView(tabIndex).getWebContents().getOSProcessId(),
        tabId: this.getTabObject(tabIndex).id,
        timeStamp: Date.now(),
        url: webview.getAttribute('src'),
      });
    }
    onLoadCommit(event: Electron.LoadCommitEvent, tabIndex: number, tabId: number): void {
      if (event.isMainFrame) {
        const navbar = this.$refs.navbar;
        (navbar as any).showUrl(event.url, tabId);
        this.$store.dispatch('loadCommit', {
          windowId: this.windowId,
          tabId,
          tabIndex,
        });
      }
    }
    onPageTitleSet(event: Electron.PageTitleUpdatedEvent, tabIndex: number, tabId: number): void {
      const webview = this.getWebView(tabIndex);
      (this as any).$electron.ipcRenderer.send('set-browser-window-title', {
        windowId: this.windowId,
        title: webview.getTitle(),
      });
      this.$store.dispatch('pageTitleSet', {
        windowId: this.windowId,
        tabId,
        tabIndex,
        title: webview.getTitle(),
      });
      if ((process.env.NODE_ENV !== 'testing')) {
        this.onUpdatedEvent.emit(tabId, {
          title: webview.getTitle(),
        },
        this.getTabObject(tabIndex));
      }
    }
    onDomReady(event: Electron.Event, tabIndex: number, tabId: number): void {
      const webview = this.getWebView(tabIndex);
      const url = webview.getURL();
      const parsedURL = urlPackage.parse(url, true);
      if (parsedURL.protocol === 'chrome:' && parsedURL.hostname === 'pdf-viewer') {
        if (this.pdfViewer === 'pdf-viewer') {
          this.$store.dispatch('domReady', {
            windowId: this.windowId,
            tabId,
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
          tabId,
          tabIndex,
          canGoBack: webview.canGoBack(),
          canGoForward: webview.canGoForward(),
        });
      }
      this.onDOMContentLoaded.emit({
        frameId: 0,
        parentFrameId: -1,
        processId: this.getWebView(tabIndex).getWebContents().getOSProcessId(),
        tabId: this.getTabObject(tabIndex).id,
        timeStamp: Date.now(),
        url,
      });
    }
    onDidFrameFinishLoad(event: Electron.DidFrameFinishLoadEvent, tabIndex: number, tabId: number): void {
      if (event.isMainFrame) {
        const webview = this.getWebView(tabIndex);
        this.$store.dispatch('didFrameFinishLoad', {
          windowId: this.windowId,
          tabId,
          tabIndex,
          url: webview.getURL(),
          canGoBack: webview.canGoBack(),
          canGoForward: webview.canGoForward(),
        });
      }
    }
    onPageFaviconUpdated(event: Electron.PageFaviconUpdatedEvent, tabIndex: number, tabId: number): void {
      this.$store.dispatch('pageFaviconUpdated', {
        windowId: this.windowId,
        tabId,
        tabIndex,
        url: event.favicons[0],
      });
      if ((process.env.NODE_ENV !== 'testing')) {
        this.onUpdatedEvent.emit(tabId, {
          favIconUrl: event.favicons[0],
        },
        this.getTabObject(tabIndex));
      }
    }
    onDidStopLoading(event: Electron.Event, tabIndex: number, tabId: number): void {
      const webview = this.getWebView(tabIndex);
      this.$store.dispatch('didStopLoading', {
        windowId: this.windowId,
        tabId,
        tabIndex,
        url: webview.getURL(),
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
      });
    }
    onDidFailLoad(event: Electron.DidFailLoadEvent, tabIndex: number, tabId: number): void {
      this.$store.dispatch('didFailLoad', {
        windowId: this.windowId,
        tabId,
        tabIndex,
        isMainFrame: event.isMainFrame,
      });
      const appPath = process.env.NODE_ENV === 'development'
        ? process.cwd()
        : (this as any).$electron.remote.app.getAppPath();
      let errorCode = event.errorCode;
      let errorPage = `file://${appPath}/helper/pages/error/index.html`;

      if (errorCode === -501) {
        const hostname = urlUtil.getHostname(event.validatedURL);
        if (hostname) {
          const certificateObject = this.certificates[hostname];
          if (certificateObject) {
            errorCode = certificateObject.errorCode;
          }
        }
      }
      errorPage += `?ec=${encodeURIComponent(errorCode.toString())}`;
      errorPage += `&url=${encodeURIComponent((event.target as any).getURL())}`;
      if (errorCode !== -3 && event.validatedURL === (event.target as any).getURL()) {
        this.getTab(tabIndex).navigateTo(
          `${errorPage}`);
      }
    }
    onIpcMessage(event: Electron.IpcMessageEvent): void {
      if (event.channel === 'newtab') {
        if (this.extensionService.newtabOverrides !== '') {
          (event.target as any).send('newtab', this.extensionService.newtabOverrides);
        } else {
          (event.target as any).send('newtab', this.$store.getters.tabConfig.dummyTabObject.url);
        }
      }
    }
    onUpdateTargetUrl(event: Electron.UpdateTargetUrlEvent, tabIndex: number, tabId: number): void {
      this.$store.dispatch('updateTargetUrl', {
        windowId: this.windowId,
        tabId,
        tabIndex,
        url: event.url,
      });
    }
    onMediaStartedPlaying(event: Electron.Event, tabIndex: number, tabId: number): void {
      const webview = this.getWebView(tabIndex);
      this.$store.dispatch('mediaStartedPlaying', {
        windowId: this.windowId,
        tabId,
        tabIndex,
        isAudioMuted: webview.isAudioMuted(),
      });
    }
    onMediaPaused(event: Electron.Event, tabIndex: number, tabId: number): void {
      this.$store.dispatch('mediaPaused', {
        windowId: this.windowId,
        tabId,
        tabIndex,
      });
    }
    onToggleAudio(event: Electron.Event, tabIndex: number, muted: boolean): void {
      const tabObject = this.getTabObject(tabIndex);
      this.getWebView(tabIndex).setAudioMuted(muted);
      this.$store.dispatch('toggleAudio', {
        windowId: this.windowId,
        tabId: tabObject.id,
        tabIndex,
        muted,
      });
      if ((process.env.NODE_ENV !== 'testing')) {
        this.onUpdatedEvent.emit(tabObject.id, {
          mutedInfo: { muted },
        },
        tabObject);
      }
    }
    onEnterHtmlFullScreen(): void {
      const nav = this.$el.querySelector('#nav') as HTMLDivElement;
      if (nav) {
        nav.style.display = 'none';
        this.getWebView().style.height = '100vh';
      }
      (this as any).$electron.remote.BrowserWindow.fromId(this.windowId).setFullScreen(true);
    }
    onLeaveHtmlFullScreen(): void {
      const nav = this.$el.querySelector('#nav') as HTMLDivElement;
      if (nav) {
        nav.style.display = 'block';
        this.getWebView().style.height = `calc(100vh - ${nav.clientHeight}px)`;
      }
      (this as any).$electron.remote.BrowserWindow.fromId(this.windowId).setFullScreen(false);
    }
    onNewWindow(event: Electron.NewWindowEvent, tabIndex: number): void {
      const disposition: string = event.disposition;
      if (disposition === 'new-window') {
        event.preventDefault();
        (event as any).newGuest = (this as any).$electron.ipcRenderer.sendSync('new-lulumi-window', {
          url: event.url,
          follow: true,
        });
      } else if (disposition === 'foreground-tab') {
        this.onNewTab(this.windowId, event.url, true);
      } else if (disposition === 'background-tab') {
        this.onNewTab(this.windowId, event.url, false);
      } else {
        // tslint:disable-next-line
        console.log(`NOTIMPLEMENTED: ${disposition}`);
      }
      /*
      this.onCreatedNavigationTarget.emit({
        sourceTabId: this.getTabObject(tabIndex).id,
        sourceProcessId: this.getWebView(tabIndex).getWebContents().getOSProcessId(),
        sourceFrameId: 0,
        timeStamp: Date.now(),
        url: event.url,
        tabId: this.$store.getters.pid,
      });
      */
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
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        if (this.pdfViewer === 'pdf-viewer') {
          const parsedURL = urlPackage.parse(data.url, true);
          webContents.downloadURL(`${parsedURL.query.file}?skip=true`);
        } else {
          webContents.loadURL(data.url);
        }
      }
    }
    onWillDownloadAnyFile(event: Electron.Event, data): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        this.showDownloadBar = true;
        this.$store.dispatch('createDownloadTask', {
          name: data.name,
          url: data.url,
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
      if (data.hostWebContentsId === this.windowWebContentsId) {
        this.$store.dispatch('updateDownloadsProgress', {
          startTime: data.startTime,
          getReceivedBytes: data.getReceivedBytes,
          savePath: data.savePath,
          isPaused: data.isPaused,
          canResume: data.canResume,
          dataState: data.dataState,
        });
      }
    }
    onCompleteDownloadsProgress(event: Electron.Event, data): void {
      if (data.hostWebContentsId === this.windowWebContentsId) {
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
    onWillNavigate(event: Electron.WillNavigateEvent, tabIndex: number, tabId: number): void {
      this.$store.dispatch('clearPageAction', {
        windowId: this.windowId,
        tabId,
        tabIndex,
      });
      this.getTab(tabIndex).onMessageEvent.listeners = [];
      this.onBeforeNavigate.emit({
        tabId: this.getTabObject(tabIndex).id,
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
        tabId: this.getTabObject(tabIndex).id,
        timeStamp: Date.now(),
        url: event.url,
      });
    }
    onGetSearchEngineProvider(event: Electron.Event, webContentsId: number): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        webContents.send('guest-here-your-data', {
          searchEngine: this.$store.getters.searchEngine,
          currentSearchEngine: this.$store.getters.currentSearchEngine,
          autoFetch: this.$store.getters.autoFetch,
        });
      }
    }
    onSetSearchEngineProvider(event: Electron.Event, data): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        this.$store.dispatch('setCurrentSearchEngineProvider', data.val);
        setTimeout(() => {
          webContents.send('guest-here-your-data', {
            searchEngine: this.$store.getters.searchEngine,
            currentSearchEngine: this.$store.getters.currentSearchEngine,
            autoFetch: this.$store.getters.autoFetch,
          });
        }, 0);
      }
    }
    onGetHomepage(event: Electron.Event, webContentsId: number): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        webContents.send('guest-here-your-data', {
          homepage: this.$store.getters.homepage,
        });
      }
    }
    onSetHomepage(event: Electron.Event, data): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        this.$store.dispatch('setHomepage', data.val);
        setTimeout(() => {
          webContents.send('guest-here-your-data', {
            homepage: this.$store.getters.homepage,
          });
        }, 0);
      }
    }
    onGetPDFViewer(event: Electron.Event, webContentsId: number): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        webContents.send('guest-here-your-data', {
          pdfViewer: this.$store.getters.pdfViewer,
        });
      }
    }
    onSetPDFViewer(event: Electron.Event, data): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        this.$store.dispatch('setPDFViewer', data.val);
        setTimeout(() => {
          webContents.send('guest-here-your-data', {
            pdfViewer: this.$store.getters.pdfViewer,
          });
        }, 0);
      }
    }
    onGetTabConfig(event: Electron.Event, webContentsId: number): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
      }
    }
    onSetTabConfig(event: Electron.Event, data): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        this.$store.dispatch('setTabConfig', data.val);
        setTimeout(() => {
          webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
        }, 0);
      }
    }
    onGetLang(event: Electron.Event, webContentsId: number): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        webContents.send('guest-here-your-data', {
          lang: this.$store.getters.lang,
        });
      }
    }
    onGetDownloads(event: Electron.Event, webContentsId: number): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        webContents.send('guest-here-your-data', this.$store.getters.downloads);
      }
    }
    onSetDownloads(event: Electron.Event, data): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        this.$store.dispatch('setDownloads', data.val);
        setTimeout(() => {
          webContents.send('guest-here-your-data', this.$store.getters.downloads);
        }, 0);
      }
    }
    onGetHistory(event: Electron.Event, webContentsId: number): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        webContents.send('guest-here-your-data', this.$store.getters.history);
      }
    }
    onSetHistory(event: Electron.Event, data): void {
      const webContents: Electron.webContents | null
        = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        this.$store.dispatch('setHistory', data.val);
        setTimeout(() => {
          webContents.send('guest-here-your-data', this.$store.getters.history);
        }, 0);
      }
    }
    // tabHandlers
    onNewTab(windowId: number = this.windowId, url: string, follow: boolean = false): void {
      this.$store.dispatch('incrementTabId');
      if (url) {
        if (url.startsWith('about:')) {
          this.$store.dispatch('createTab', {
            windowId,
            url: urlResource.aboutUrls(url),
            isURL: true,
            follow: true,
          });
        } else {
          this.$store.dispatch('createTab', {
            windowId,
            url,
            isURL: urlUtil.isURL(url),
            follow,
          });
        }
      }
      setTimeout(() => {
        this.$store.dispatch('setTabsOrder', {
          windowId: this.windowId,
          tabsOrder: (this.$refs.tabs as Tabs).sortable.toArray(),
        });
        if ((process.env.NODE_ENV !== 'testing')) {
          this.onCreatedEvent.emit(this.getTabObject(this.currentTabIndex));
        }
      }, 300);
    }
    onTabDuplicate(tabIndex: number): void {
      this.onNewTab(this.windowId, this.getTab[tabIndex].url, true);
    }
    onTabClick(tabIndex: number): void {
      if (tabIndex === -1) {
        tabIndex = this.tabs.length - 1;
      }
      const TabObject: store.TabObject = this.getTabObject(tabIndex);
      if (TabObject) {
        const tabId: number = TabObject.id;
        const tabTitle: string | null = TabObject.title;
        this.$store.dispatch('clickTab', {
          windowId: this.windowId,
          tabId,
          tabIndex,
        });
        if (tabTitle) {
          (this as any).$electron.ipcRenderer.send('set-browser-window-title', {
            windowId: this.windowId,
            title: tabTitle,
          });
        }
      }
    }
    onTabClose(tabIndex: number): void {
      if (tabIndex === -1) {
        tabIndex = this.tabs.length - 1;
      }
      const TabObject: store.TabObject = this.getTabObject(tabIndex);
      if (TabObject) {
        const tabId: number = TabObject.id;
        this.onRemovedEvent.emit(TabObject);
        this.$store.dispatch('closeTab', {
          windowId: this.windowId,
          tabId,
          tabIndex,
        });
        setTimeout(() => this.$store.dispatch('setTabsOrder', {
          windowId: this.windowId,
          tabsOrder: (this.$refs.tabs as Tabs).sortable.toArray(),
        }), 300);
      }
    }
    // navHandlers
    onClickHome(): void {
      this.getTab().navigateTo(this.homepage);
    }
    onClickBack(): void {
      if (this.getTabObject().error) {
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
      if (webview.getURL() === this.tab.url) {
        webview.reload();
      } else {
        webview.loadURL(this.tab.url);
      }
    }
    onClickForceRefresh(): void {
      const webview = this.getWebView();
      if (webview.getURL() === this.tab.url) {
        webview.reloadIgnoringCache();
      } else {
        webview.loadURL(this.tab.url);
      }
    }
    onClickViewSource(): void {
      const webview = this.getWebView();
      if (webview.getURL() === this.tab.url) {
        const sourceUrl = urlUtil.getViewSourceUrlFromUrl(this.getTabObject().url);
        if (sourceUrl !== null) {
          this.onNewTab(this.windowId, sourceUrl, true);
        }
      }
    }
    onClickToggleDevTools(): void {
      const webview = this.getWebView();
      if (webview.getURL() === this.tab.url) {
        webview.getWebContents().openDevTools({ mode: 'bottom' });
      } else {
        webview.loadURL(this.tab.url);
      }
    }
    onClickJavaScriptPanel(): void {
      const webview = this.getWebView();
      const webContent = webview.getWebContents();
      if (webContent.isDevToolsOpened()) {
        webContent.closeDevTools();
      } else {
        webContent.once('devtools-opened', () => {
          const dtwc = webContent.devToolsWebContents;
          if (dtwc) {
            dtwc.executeJavaScript('DevToolsAPI.showPanel("console")');
          }
        });
        webContent.openDevTools();
      }
    }
    onEnterUrl(url: string): void {
      let newUrl: string;
      if (url.startsWith('about:')) {
        newUrl = urlResource.aboutUrls(url);
      } else if (urlUtil.isNotURL(url)) {
        newUrl = `${this.$store.getters.currentSearchEngine.search}${url}`;
      } else {
        newUrl = url;
      }
      this.getTab().navigateTo(newUrl);
    }
    // onTabContextMenu
    onTabContextMenu(event: Electron.Event, tabIndex: number): void {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
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

      menu.popup(currentWindow, { async: true });
    }
    // onClickBackContextMenu
    async onClickBackContextMenu(): Promise<void> {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const webview = this.getWebView();
      const webContents: any = webview.getWebContents();
      const navbar = document.getElementById('browser-navbar');
      const goBack = document.getElementById('browser-navbar__goBack');

      const current = webContents.getActiveIndex();
      const urls = webContents.history;

      const history = await this.historyMappings();

      if (goBack !== null && navbar !== null) {
        if (current <= urls.length - 1 && current !== 0) {
          for (let i = current - 1; i >= 0; i--) {
            try {
              menu.append(new MenuItem({
                label: history[urls[i]].title,
                click: () => webview.goToIndex(i),
              }));
            } catch (e) {
              menu.append(new MenuItem({
                label: urls[i],
                click: () => webview.goToIndex(i),
              }));
            }
          }

          menu.append(new MenuItem({ type: 'separator' }));
          menu.append(new MenuItem({
            label: this.$t('navbar.navigator.history'),
            click: () => this.onNewTab(this.windowId, 'about:history', false),
          }));

          menu.popup(currentWindow, {
            async: true,
            x: Math.floor(goBack.getBoundingClientRect().left),
            y: Math.floor(navbar.getBoundingClientRect().bottom),
          });
        }
      }
    }
    // onClickForwardContextMenu
    async onClickForwardContextMenu(): Promise<void> {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const webview = this.getWebView();
      const webContents: any = webview.getWebContents();
      const navbar = document.getElementById('browser-navbar');
      const goForward = document.getElementById('browser-navbar__goForward');

      const current = webContents.getActiveIndex();
      const urls = webContents.history;

      const history = await this.historyMappings();

      if (goForward !== null && navbar !== null) {
        if (current <= urls.length - 1 && current !== urls.length - 1) {
          for (let i = current + 1; i < urls.length; i++) {
            try {
              menu.append(new MenuItem({
                label: history[urls[i]].title,
                click: () => webview.goToIndex(i),
              }));
            } catch (e) {
              menu.append(new MenuItem({
                label: urls[i],
                click: () => webview.goToIndex(i),
              }));
            }
          }

          menu.append(new MenuItem({ type: 'separator' }));
          menu.append(new MenuItem({
            label: this.$t('navbar.navigator.history'),
            click: () => this.onNewTab(this.windowId, 'about:history', false),
          }));

          menu.popup(currentWindow, {
            async: true,
            x: Math.floor(goForward.getBoundingClientRect().left),
            y: Math.floor(navbar.getBoundingClientRect().bottom),
          });
        }
      }
    }
    // onNavContextMenu
    onNavContextMenu(event: Electron.Event): void {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
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
          let url = el.value.slice(0, el.selectionStart);
          url += clipboard.readText();
          url += el.value.slice(el.selectionEnd);
          this.onEnterUrl(url);
        },
      }));

      menu.popup(currentWindow, { async: true });
    }
    // onCommonMenu
    onCommonMenu(): void {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const navbar = document.getElementById('browser-navbar');
      const common = document.getElementById('browser-navbar__common');
      let sub: Electron.MenuItem[] = [
        new MenuItem({
          label: this.$t('navbar.common.options.lulumi'),
          click: () => this.onNewTab(this.windowId, 'about:lulumi', false),
        }),
      ];

      if (navbar !== null && common !== null) {
        if (is.windows) {
          menu.append(new MenuItem({
            label: this.$t('file.newTab'),
            accelerator: 'CmdOrCtrl+T',
            click: () => this.onNewTab(this.windowId, 'about:newtab', false),
          }));
          menu.append(new MenuItem({
            label: this.$t('file.newWindow'),
            accelerator: 'CmdOrCtrl+N',
            click: () => (this as any).$electron.remote.BrowserWindow.createWindow(),
          }));
          menu.append(new MenuItem({ type: 'separator' }));
        }

        const lastOpenedTabs: store.LastOpenedTabObject[] = [];
        this.lastOpenedTabs().forEach((tab) => {
          lastOpenedTabs.push(new MenuItem({
            label: tab.title,
            click: () => this.onNewTab(this.windowId, tab.url, true),
          }));
        });

        const windowHistories: any[] = [];
        const data: any = (this as any).$electron.ipcRenderer.sendSync('get-window-properties');
        data.forEach((windowProperty) => {
          windowHistories.push(new MenuItem({
            label: this.$t(
              'navbar.common.options.history.tabs',{ amount: windowProperty.amount }),
            click: () => (this as any).$electron.ipcRenderer
              .send('restore-window-property', windowProperty),
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
            new MenuItem({ label: this.$t(
              'navbar.common.options.history.recentlyClosed'), enabled: false }),
          ].concat(windowHistories.concat(lastOpenedTabs)),
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
        if (is.windows) {
          sub = sub.concat([
            new MenuItem({
              label: this.$t('help.reportIssue'),
              click: () => this.onNewTab(this.windowId, 'https://github.com/LulumiProject/lulumi-browser/issues', true),
            }),
            new MenuItem({
              label: this.$t('help.forceReload'),
              click: () => currentWindow.webContents.reloadIgnoringCache(),
            }),
            new MenuItem({
              label: this.$t('help.toggleDevTools'),
              click: () => currentWindow.webContents.toggleDevTools(),
            }),
            new MenuItem({ type: 'separator' }),
            new MenuItem({
              label: this.$t('window.processManager'),
              click: () => (this as any).$electron.ipcRenderer.send('open-process-manager'),
            }),
          ]);
        }
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.help'),
          submenu: sub,
        }));

        menu.popup(currentWindow, {
          async: true,
          x: Math.floor(common.getBoundingClientRect().right),
          y: Math.floor(navbar.getBoundingClientRect().bottom),
        });
      }
    }
    // onWebviewContextMenu
    onWebviewContextMenu(event: Electron.Event): void {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();
      const clipboard = (this as any).$electron.clipboard;

      const webview = this.getWebView();
      const tab = this.getTabObject();
      const params: Electron.ContextMenuParams = (event as any).params;
      const editFlags = params.editFlags;

      const registerExtensionContextMenus = (menu) => {
        const contextMenus = JSON.parse(JSON.stringify(this.contextMenus));
        Object.keys(contextMenus).forEach((webContentsIdInString) => {
          contextMenus[webContentsIdInString].forEach((menuItems) => {
            menuItems.forEach((menuItem) => {
              if (menuItem.type !== 'separator') {
                menuItem.label = menuItem.label.replace('%s', params.selectionText);
                menuItem.click = (menuItem, BrowserWindow) => {
                  (this as any).$electron.remote.webContents.fromId(menuItem.webContentsId)
                    .send(`lulumi-context-menus-clicked-${menuItem.extensionId}-${menuItem.id}`,
                      params,
                      this.getTabObject(this.currentTabIndex).id,
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
                          this.getTabObject(this.currentTabIndex).id,
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
        if (Object.keys(contextMenus).length !== 0) {
          menu.append(new MenuItem({ type: 'separator' }));
        }
      };

      if (params.isEditable) {
        if (editFlags.canUndo) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.undo'),
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo',
          }));
        }

        if (editFlags.canRedo) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.redo'),
            accelerator: 'CmdOrCtrl+Shift+Z',
            role: 'redo',
          }));
        }

        menu.append(new MenuItem({ type: 'separator' }));

        if (editFlags.canCut) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.cut'),
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          }));
        }

        if (editFlags.canCopy) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.copy'),
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          }));
        }

        if (editFlags.canPaste) {
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
      } else if (params.linkURL) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.openLinkInNewTab'),
          click: () => this.onNewTab(this.windowId, params.linkURL, false),
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.openLinkInNewWindow'),
          click: () => {
            const webContent = webview.getWebContents();
            webContent.executeJavaScript(`window.open('${params.linkURL}')`);
          }
        }));

        menu.append(new MenuItem({ type: 'separator' }));

        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.copyLinkAddress'),
          click: () => {
            clipboard.writeText(params.linkURL);
          },
        }));
      } else if (params.hasImageContents) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.openImageInNewTab'),
          click: () => this.onNewTab(this.windowId, params.srcURL, false),
        }));
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
                  currentWindow, {
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
          label: this.$t('webview.contextMenu.copyImage'),
          click: () => {
            const electron = (this as any).$electron;
            urlUtil.getFilenameFromUrl(params.srcURL).then(
              async (filename) => {
                  if (filename) {
                    const dataURL = await imageUtil.getBase64FromImageUrl(params.srcURL);
                    clipboard.writeImage(electron.nativeImage.createFromDataURL(dataURL));
                  }
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
      } else if (params.selectionText) {
        if (is.macos) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.lookUp', { selectionText: params.selectionText }),
            click: () => {
              webview.showDefinitionForSelection();
            },
          }));

          menu.append(new MenuItem({ type: 'separator' }));
        }

        if (editFlags.canCopy) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.copy'),
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          }));
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.searchFor', {
              selectionText: params.selectionText,
              searchEngine: this.$store.getters.currentSearchEngine.name,
            }),
            click: () => this.onNewTab(this.windowId, params.selectionText, false),
          }));
        }
      } else {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.back'),
          click: () => {
            this.onClickBack();
          },
          enabled: tab.canGoBack,
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.forward'),
          click: () => {
            this.onClickForward();
          },
          enabled: tab.canGoForward,
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.reload'),
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            this.onClickRefresh();
          },
          enabled: tab.canRefresh,
        }));
      }

      menu.append(new MenuItem({ type: 'separator' }));

      // lulumi.contextMenus
      registerExtensionContextMenus(menu);

      const sourceUrl = urlUtil.getViewSourceUrlFromUrl(this.getTabObject().url);
      if (sourceUrl !== null) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.viewSource'),
          accelerator: is.macos ? 'Alt+Command+U' : 'Ctrl+U',
          click: this.onClickViewSource,
        }));
      }
      menu.append(new MenuItem({
        label: this.$t('webview.contextMenu.javascriptPanel'),
        accelerator: is.macos ? 'Alt+Command+J' : 'Ctrl+Shift+J',
        click: this.onClickJavaScriptPanel,
      }));
      menu.append(new MenuItem({
        label: this.$t('webview.contextMenu.inspectElement'),
        accelerator: is.macos ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click: () => {
          webview.inspectElement(params.x, params.y);
        },
      }));

      menu.popup(currentWindow, { async: true });
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
        const windowProperty = ipc.sendSync('window-id');
        this.windowId = windowProperty.windowId;
        this.windowWebContentsId = windowProperty.windowWebContentsId;

        ipc.once(`new-tab-suggestion-for-window-${this.windowId}`,
          (event: Electron.Event, suggestion: main.BrowserWindowSuggestionItem | null) => {
          if (suggestion !== null && this.tabs.length === 0) {
            this.onNewTab(this.windowId, suggestion.url, suggestion.follow);
          }
        });
        // we have to call ipc.send anyway in order to cancel/trigger the corresponding event listener
        ipc.send(`any-new-tab-suggestion-for-window-${this.windowId}`);
      } else {
        this.windowId = 0;

        if (this.tabs.length === 0) {
          this.onNewTab(this.windowId, 'https://github.com/LulumiProject/lulumi-browser', true);
        }
      }

      this.extensionService = new ExtensionService(this);
    }
    mounted() {
      if (is.macos) {
        document.body.classList.add('darwin');
      }
      // removed unneeded tabs
      this.$store.dispatch('closeAllTab', 0);

      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;

      ipc.on('go-back', () => {
        this.onClickBack();
      });
      ipc.on('go-forward', () => {
        this.onClickForward();
      });
      ipc.on('reload', () => {
        this.onClickRefresh();
      });
      ipc.on('force-reload', () => {
        this.onClickForceRefresh();
      });
      ipc.on('view-source', () => {
        this.onClickViewSource();
      });
      ipc.on('toggle-dev-tools', () => {
        this.onClickToggleDevTools();
      });
      ipc.on('javascript-panel', () => {
        this.onClickJavaScriptPanel();
      });
      ipc.on('new-tab', (event, payload) => {
        if (payload) {
          this.onNewTab(this.windowId, payload.url, payload.follow);
        } else {
          this.onNewTab(this.windowId, 'about:newtab', false);
        }
      });
      ipc.on('tab-close', () => {
        if (this.currentTabIndex !== undefined) {
          this.onTabClose(this.currentTabIndex);
        }
      });
      ipc.on('tab-click', (event, tabIndexThatWeSee) => {
        const els = document.querySelectorAll('.chrome-tab-draggable') as NodeListOf<HTMLDivElement>;
        const el = (tabIndexThatWeSee === -1)
          ? els[els.length - 1]
          : els[tabIndexThatWeSee];
        if (el) {
          el.click();
        }
      });
      ipc.on('escape-click', () => {
        this.onLeaveHtmlFullScreen();
      });
      ipc.on('start-find-in-page', () => {
        this.getTab(this.currentTabIndex).findInPage();
      });
      ipc.on('open-pdf', (event, data) => {
        this.onOpenPDF(event, data);
      });
      ipc.on('scroll-touch-begin', (event, swipeGesture) => {
        this.onScrollTouchBegin(event, swipeGesture);
      });
      ipc.on('scroll-touch-end', () => {
        this.onScrollTouchEnd();
      });
      ipc.on('scroll-touch-edge', () => {
        this.onScrollTouchEdge();
      });
      ipc.on('will-download-any-file', (event, data) => {
        this.onWillDownloadAnyFile(event, data);
      });
      ipc.on('update-downloads-progress', (event, data) => {
        this.onUpdateDownloadsProgress(event, data);
      });
      ipc.on('complete-downloads-progress', (event, data) => {
        this.onCompleteDownloadsProgress(event, data);
      });

      ipc.on('get-search-engine-provider', (event: Electron.Event, webContentsId: number) => {
        this.onGetSearchEngineProvider(event, webContentsId);
      });
      ipc.on('set-search-engine-provider', (event, val) => {
        this.onSetSearchEngineProvider(event, val);
      });
      ipc.on('get-homepage', (event: Electron.Event, webContentsId: number) => {
        this.onGetHomepage(event, webContentsId);
      });
      ipc.on('set-homepage', (event, val) => {
        this.onSetHomepage(event, val);
      });
      ipc.on('get-pdf-viewer', (event: Electron.Event, webContentsId: number) => {
        this.onGetPDFViewer(event, webContentsId);
      });
      ipc.on('set-pdf-viewer', (event, val) => {
        this.onSetPDFViewer(event, val);
      });
      ipc.on('get-tab-config', (event: Electron.Event, webContentsId: number) => {
        this.onGetTabConfig(event, webContentsId);
      });
      ipc.on('set-tab-config', (event, val) => {
        this.onSetTabConfig(event, val);
      });
      ipc.on('get-lang', (event: Electron.Event, webContentsId: number) => {
        this.onGetLang(event, webContentsId);
      });
      ipc.on('get-downloads', (event: Electron.Event, webContentsId: number) => {
        this.onGetDownloads(event, webContentsId);
      });
      ipc.on('set-downloads', (event, val) => {
        this.onSetDownloads(event, val);
      });
      ipc.on('get-history', (event: Electron.Event, webContentsId: number) => {
        this.onGetHistory(event, webContentsId);
      });
      ipc.on('set-history', (event, val) => {
        this.onSetHistory(event, val);
      });

      ipc.on('remove-non-bg-lulumi-extension', (event: Electron.Event, extensionId: string) => {
        ipc.send(`remove-lulumi-extension-${extensionId}`);
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
  #footer > .browser-tab-status {
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
