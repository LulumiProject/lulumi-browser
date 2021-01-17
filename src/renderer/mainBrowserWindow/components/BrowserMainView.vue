<template lang="pug">
div
  #nav(ref="nav")
    tabs(ref="tabs", :windowId="windowId")
    navbar(ref="navbar", :windowId="windowId")
  transition(name="notification")
    #notification(v-show="showNotification")
      notification(:windowWebContentsId="windowWebContentsId",
                   :tabId="tab.id")
  swipe-arrow
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
  status-bar(:windowId="windowId")
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import * as path from 'path';
import * as urlPackage from 'url';
import { is } from 'electron-util';

import Tabs from './BrowserMainView/Tabs.vue';
import Navbar from './BrowserMainView/Navbar.vue';
import SwipeArrow from './BrowserMainView/SwipeArrow.vue';
import Tab from './BrowserMainView/Tab.vue';
import Download from './BrowserMainView/Download.vue';
import Notification from './BrowserMainView/Notification.vue';
import StatusBar from './BrowserMainView/StatusBar.vue';

import constants from '../constants';
import urlUtil from '../../lib/url-util';
import imageUtil from '../../lib/image-util';

import ExtensionService from '../../api/extension-service';
import Event from '../../api/event';

@Component({
  name: 'browser-main',
  components: {
    Tabs,
    Navbar,
    SwipeArrow,
    Tab,
    Download,
    Notification,
    StatusBar,
  },
})
export default class BrowserMainView extends Vue {
  windowId = 0;
  windowWebContentsId = 0;
  showNotification = false;
  htmlFullscreen = false;
  trackingFingers = false;
  swipeGesture = false;
  isSwipeOnEdge = false;
  deltaX = 0;
  deltaY = 0;
  hnorm = 0;
  startTime = 0;
  showDownloadBar = false;
  extensionService: ExtensionService;
  contextMenus: any = {};
  onCommandEvent: Event = new Event();
  onUpdatedEvent: Event = new Event();
  onCreatedEvent: Event = new Event();
  onRemovedEvent: Event = new Event();
  alarms: Lulumi.BrowserMainView.AlarmArray = {};
  onActivatedEvent: Event = new Event();
  onAlarmEvent: Event = new Event();
  onBeforeNavigate: Event = new Event();
  onCreatedNavigationTarget: Event = new Event();
  onCommitted: Event = new Event();
  onCompleted: Event = new Event();
  onDOMContentLoaded: Event = new Event();

  get dummyTabObject(): Lulumi.Store.TabObject {
    return this.$store.getters.tabConfig.dummyTabObject;
  }
  get window(): Lulumi.Store.LulumiBrowserWindowProperty {
    return this.$store.getters.windows.find(window => window.id === this.windowId);
  }
  get currentTabIndex(): number | undefined {
    return this.$store.getters.currentTabIndexes[this.windowId];
  }
  get tabs(): Lulumi.Store.TabObject[] {
    return this.$store.getters.tabs.filter(tab => tab.windowId === this.windowId);
  }
  get tab(): Lulumi.Store.TabObject {
    if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
      return this.dummyTabObject;
    }
    return this.tabs[this.currentTabIndex];
  }
  get tabsOrder(): number[] {
    return this.$store.getters.tabsOrder[this.windowId];
  }
  get homepage(): string {
    return this.$store.getters.homepage;
  }
  get pdfViewer(): string {
    return this.$store.getters.pdfViewer;
  }
  get certificates(): Lulumi.Store.Certificates {
    return this.$store.getters.certificates;
  }
  get historyMenuItem(): Electron.MenuItemConstructorOptions[] {
    const recentlyClosed: any = [];
    this.lastOpenedTabs().forEach((lastOpenedTab) => {
      recentlyClosed.push(
        {
          label: lastOpenedTab.title,
          click: () => this.onNewTab(this.windowId, lastOpenedTab.url, true),
          mtime: lastOpenedTab.mtime,
        },
      );
    });

    const windowProperties: any = this.$electron.ipcRenderer.sendSync('get-window-properties');
    windowProperties.forEach((windowProperty) => {
      recentlyClosed.push(
        {
          label: this.$t(
            'navbar.common.options.history.tabs', { amount: windowProperty.amount }
          ) as string,
          click: () => this.$electron.ipcRenderer
            .send('restore-window-property', windowProperty),
          mtime: windowProperty.mtime,
        },
      );
    });

    recentlyClosed.sort((a, b) => (b.mtime - a.mtime))
      .map(m => delete m.mtime);
    if (recentlyClosed[0] !== undefined) {
      recentlyClosed[0].accelerator = 'CmdOrCtrl+Shift+T';
    }

    return recentlyClosed;
  }

  getBrowserView(tabIndex?: number): Electron.BrowserView {
    let index: number | undefined = tabIndex;
    if (index === undefined) {
      if (this.currentTabIndex === undefined) {
        index = 0;
      } else {
        index = this.currentTabIndex;
      }
    }
    return this.$refs[`tab-${index}`][0].getBrowserView();
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
  getTabObject(tabIndex?: number): Lulumi.Store.TabObject {
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
  getNavAndStatusBarHeight(): number {
    const nav = this.$el.querySelector('#nav') as HTMLDivElement;
    if (nav) {
      const statusBar = this.$el.querySelector('#status-bar') as HTMLDivElement;
      if (statusBar) {
        return nav.clientHeight + statusBar.clientHeight;
      }
      return nav.clientHeight;
    }
    return 0;
  }
  async historyMappings(): Promise<any> {
    const out: any = {};
    this.$store.getters.history.forEach((h) => {
      if (!out[h.url]) {
        out[h.url] = {
          title: h.title,
          icon: h.favIconUrl,
        };
      }
    });
    return out;
  }
  lastOpenedTabs(): Lulumi.Store.LastOpenedTabObject[] {
    const lastOpenedTabs: Lulumi.Store.LastOpenedTabObject[] =
      this.$store.getters.lastOpenedTabs.slice(0, 8);
    // clone every tab so that we won't modify the vuex object directly
    lastOpenedTabs.map((tab, index) => (lastOpenedTabs[index] = Object.assign({}, tab)));
    lastOpenedTabs.forEach((lastOpenedTab) => {
      switch (lastOpenedTab.title) {
        case 'about:about':
          lastOpenedTab.title = this.$t('lulumi.aboutPage.title');
          break;
        case 'about:lulumi':
          lastOpenedTab.title = this.$t('lulumi.lulumiPage.title');
          break;
        case 'about:preferences/search':
          lastOpenedTab.title = this.$t('lulumi.preferencesPage.searchEngineProviderPage.title');
          break;
        case 'about:preferences/homepage':
          lastOpenedTab.title = this.$t('lulumi.preferencesPage.homePage.title');
          break;
        case 'about:preferences/pdfViewer':
          lastOpenedTab.title = this.$t('lulumi.preferencesPage.pdfViewerPage.title');
          break;
        case 'about:preferences/tab':
          lastOpenedTab.title = this.$t('lulumi.preferencesPage.tabConfigPage.title');
          break;
        case 'about:preferences/language':
          lastOpenedTab.title = this.$t('lulumi.preferencesPage.LanguagePage.title');
          break;
        case 'about:downloads':
          lastOpenedTab.title = this.$t('lulumi.downloadsPage.title');
          break;
        case 'about:history':
          lastOpenedTab.title = this.$t('lulumi.historyPage.title');
          break;
        case 'about:extensions':
          lastOpenedTab.title = this.$t('lulumi.extensionsPage.title');
          break;
        case 'about:newtab':
          lastOpenedTab.title = this.$t('lulumi.newtabPage.title');
          break;
        case 'about:playbooks':
          lastOpenedTab.title = this.$t('lulumi.playbooks.title');
          break;
        default:
          lastOpenedTab.title = this.$t('lulumi.aboutPage.title');
          break;
      }
    });
    return lastOpenedTabs;
  }
  // lulumi.alarms
  getAlarm(name: string): Lulumi.BrowserMainView.Alarm | undefined {
    return this.alarms[name];
  }
  getAllAlarm(): Lulumi.BrowserMainView.AlarmArray {
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
  createAlarm(name: string, alarmInfo: any): void {
    const alarm: Lulumi.BrowserMainView.Alarm = {
      handler: null,
    };
    let timeout = 0;

    this.clearAlarm(name);

    if (alarmInfo.when) {
      timeout = alarmInfo.when - Date.now();
    } else if (alarmInfo.delayInMinutes) {
      timeout = alarmInfo.delayInMinutes * 60 * 1000;
    } else if (alarmInfo.periodInMinutes) {
      timeout = alarmInfo.periodInMinutes * 60 * 1000;
    }
    if (timeout !== 0) {
      alarm.handler =
        setTimeout(() => this.onAlarmEvent.emit(this.getAlarm(name)), timeout);
      if (alarmInfo.periodInMinutes) {
        timeout = alarmInfo.periodInMinutes * 60 * 1000;
        alarm.handler =
          setInterval(() => this.onAlarmEvent.emit(this.getAlarm(name)), timeout);
        alarm.periodInMinutes = alarmInfo.periodInMinutes;
      }

      Vue.set(this.alarms, name, alarm);
    }
  }
  addContextMenus(menuItems: any, webContentsId: number): void {
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
    const view = this.getBrowserView(tabIndex);
    this.$store.dispatch('didStartLoading', {
      tabId,
      tabIndex,
      url: view.webContents.getURL(),
      webContentsId: view.webContents.id,
      windowId: this.windowId,
    });
    if (!(process.env.NODE_ENV === 'test' && process.env.TEST_ENV === 'unit')) {
      this.onUpdatedEvent.emit(
        tabId,
        {
          url: view.webContents.getURL(),
        },
        this.getTabObject(tabIndex)
      );
    }
    this.onCommitted.emit({
      frameId: 0,
      parentFrameId: -1,
      processId: this.$electron.remote.webContents.fromId(
        this.getBrowserView(tabIndex).webContents.id
      ).getOSProcessId(),
      tabId: this.getTabObject(tabIndex).id,
      timeStamp: Date.now(),
      url: view.webContents.getURL(),
    });
  }
  onDidNavigate(event: Electron.DidNavigateEvent, tabIndex: number, tabId: number): void {
    this.$store.dispatch('didNavigate', {
      tabId,
      tabIndex,
      url: event.url,
      windowId: this.windowId,
    });
    this.onCompleted.emit({
      frameId: 0,
      parentFrameId: -1,
      processId: this.$electron.remote.webContents.fromId(
        this.getBrowserView(tabIndex).webContents.id
      ).getOSProcessId(),
      tabId: this.getTabObject(tabIndex).id,
      timeStamp: Date.now(),
      url: event.url,
    });
  }
  onPageTitleUpdated(event: Electron.PageTitleUpdatedEvent, tabIndex: number, tabId: number): void {
    this.$electron.ipcRenderer.send('set-browser-window-title', {
      title: event.title,
      windowId: this.windowId,
    });
    this.$store.dispatch('pageTitleUpdated', {
      tabId,
      tabIndex,
      title: event.title,
      windowId: this.windowId,
    });
    if (!(process.env.NODE_ENV === 'test' && process.env.TEST_ENV === 'unit')) {
      this.onUpdatedEvent.emit(
        tabId,
        {
          title: event.title,
        },
        this.getTabObject(tabIndex)
      );
    }
  }
  onDomReady(event: Electron.Event, tabIndex: number, tabId: number): void {
    const view = this.getBrowserView(tabIndex);
    const url = view.webContents.getURL();
    const parsedURL = urlPackage.parse(url, true);
    if (parsedURL.protocol === 'chrome:' && parsedURL.hostname === 'pdf-viewer') {
      if (this.pdfViewer === 'pdf-viewer') {
        this.$store.dispatch('domReady', {
          tabId,
          tabIndex,
          canGoBack: view.webContents.canGoBack(),
          canGoForward: view.webContents.canGoForward(),
          windowId: this.windowId,
        });
      } else {
        this.$electron.remote.webContents.fromId(
          view.webContents.id
        ).downloadURL(parsedURL.query.src as string);
      }
    } else {
      this.$store.dispatch('domReady', {
        tabId,
        tabIndex,
        canGoBack: view.webContents.canGoBack(),
        canGoForward: view.webContents.canGoForward(),
        windowId: this.windowId,
      });
    }
    this.onDOMContentLoaded.emit({
      url,
      frameId: 0,
      parentFrameId: -1,
      processId: this.$electron.remote.webContents.fromId(
        this.getBrowserView(tabIndex).webContents.id
      ).getOSProcessId(),
      tabId: this.getTabObject(tabIndex).id,
      timeStamp: Date.now(),
    });
  }
  // eslint-disable-next-line max-len
  onDidFrameFinishLoad(event: Electron.DidFrameFinishLoadEvent, tabIndex: number, tabId: number): void {
    if (event.isMainFrame) {
      const view = this.getBrowserView(tabIndex);
      this.$store.dispatch('didFrameFinishLoad', {
        tabId,
        tabIndex,
        url: view.webContents.getURL(),
        canGoBack: view.webContents.canGoBack(),
        canGoForward: view.webContents.canGoForward(),
        windowId: this.windowId,
      });
    }
  }
  // eslint-disable-next-line max-len
  async onPageFaviconUpdated(event: Electron.PageFaviconUpdatedEvent, tabIndex: number, tabId: number): Promise<void> {
    let dataUrl = '';
    try {
      dataUrl = await imageUtil.getBase64FromImageUrl(event.favicons[0]);
    } catch (err) {
      [dataUrl] = event.favicons;
    }
    this.$store.dispatch('pageFaviconUpdated', {
      tabId,
      tabIndex,
      url: dataUrl,
      windowId: this.windowId,
    });
    if (!(process.env.NODE_ENV === 'test' && process.env.TEST_ENV === 'unit')) {
      this.onUpdatedEvent.emit(
        tabId,
        {
          favIconUrl: dataUrl,
        },
        this.getTabObject(tabIndex)
      );
    }
  }
  onDidStopLoading(event: Electron.Event, tabIndex: number, tabId: number): void {
    const view = this.getBrowserView(tabIndex);
    this.$store.dispatch('didStopLoading', {
      tabId,
      tabIndex,
      url: view.webContents.getURL(),
      canGoBack: view.webContents.canGoBack(),
      canGoForward: view.webContents.canGoForward(),
      windowId: this.windowId,
    });
  }
  onDidFailLoad(event: Electron.DidFailLoadEvent, tabIndex: number, tabId: number): void {
    this.$store.dispatch('didFailLoad', {
      tabId,
      tabIndex,
      isMainFrame: event.isMainFrame,
      windowId: this.windowId,
    });
    const appPath = process.env.NODE_ENV === 'development'
      ? path.join(process.cwd(), 'src/helper')
      : path.join(this.$electron.remote.app.getAppPath(), 'dist');
    let { errorCode } = event;
    let errorPage = `file://${appPath}/pages/error/index.html`;

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
    errorPage += `&url=${encodeURIComponent((event as any).url)}`;
    if (errorCode !== -3 &&
      event.validatedURL === (event as any).url) {
      this.getTab(tabIndex).navigateTo(`${errorPage}`);
    }
  }
  onIpcMessage(event: Electron.IpcMessageEvent): void {
    const { target } = event;
    if (event.channel === 'newtab') {
      if (this.extensionService.newtabOverrides !== '') {
        (target as any).send('newtab', this.extensionService.newtabOverrides);
      } else {
        (target as any).send('newtab', '');
      }
    }
  }
  onUpdateTargetUrl(event: Electron.UpdateTargetUrlEvent, tabIndex: number, tabId: number): void {
    this.$store.dispatch('updateTargetUrl', {
      tabId,
      tabIndex,
      url: event.url,
      windowId: this.windowId,
    });
  }
  onMediaStartedPlaying(event: Electron.Event, tabIndex: number, tabId: number): void {
    const view = this.getBrowserView(tabIndex);
    this.$store.dispatch('mediaStartedPlaying', {
      tabId,
      tabIndex,
      isAudioMuted: view.webContents.isAudioMuted(),
      windowId: this.windowId,
    });
  }
  onMediaPaused(event: Electron.Event, tabIndex: number, tabId: number): void {
    this.$store.dispatch('mediaPaused', {
      tabId,
      tabIndex,
      windowId: this.windowId,
    });
  }
  onToggleAudio(event: Electron.Event, tabIndex: number, muted: boolean): void {
    const tabObject = this.getTabObject(tabIndex);
    this.getBrowserView(tabIndex).webContents.setAudioMuted(muted);
    this.$store.dispatch('toggleAudio', {
      tabIndex,
      muted,
      tabId: tabObject.id,
      windowId: this.windowId,
    });
    if (!(process.env.NODE_ENV === 'test' && process.env.TEST_ENV === 'unit')) {
      this.onUpdatedEvent.emit(
        tabObject.id,
        {
          mutedInfo: { muted },
        },
        tabObject
      );
    }
  }
  onEnterHtmlFullScreen(): void {
    this.$electron.remote.BrowserWindow.fromId(this.windowId).setFullScreen(true);
    this.htmlFullscreen = true;
  }
  onLeaveHtmlFullScreen(): void {
    if (this.htmlFullscreen) {
      this.htmlFullscreen = false;
      const nav = this.$el.querySelector('#nav') as HTMLDivElement;
      if (nav) {
        nav.style.display = 'block';
        const view = this.getBrowserView();
        const bounds = view.getBounds();
        bounds.height -= (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
        bounds.y += (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
        view.setBounds(bounds);
        const jsScript = 'document.webkitExitFullscreen()';
        this.getBrowserView().webContents.executeJavaScript(jsScript, true);
      }
      this.$electron.remote.BrowserWindow.fromId(this.windowId).setFullScreen(false);
      if (is.macos) {
        this.$electron.remote.BrowserWindow.fromId(this.windowId).setSimpleFullScreen(false);
      }
    }
  }
  /*
  onNewWindow(event: Electron.NewWindowEvent, tabIndex: number): void {
    const { disposition } = event;
    const { options }: any = event;
    if (disposition === 'new-window') {
      // https://github.com/electron/electron/blob/9-x-y/lib/browser/api/web-contents.js#L501-L505
      if (options.width === 800 &&
        options.height === 600 &&
        options.webPreferences.nativeWindowOpen === false) {
        this.onNewTab(this.windowId, event.url, true);
      } else {
        event.preventDefault();
        (event as any).newGuest = this.$electron.ipcRenderer.sendSync('new-lulumi-window', {
          url: event.url,
          follow: true,
        });
      }
    } else if (disposition === 'foreground-tab') {
      this.onNewTab(this.windowId, event.url, true);
    } else if (disposition === 'background-tab') {
      this.onNewTab(this.windowId, event.url, false);
    } else {
      // eslint-disable-next-line no-console
      console.log(`NOTIMPLEMENTED: ${disposition}`);
    }
    this.onCreatedNavigationTarget.emit({
      sourceTabId: this.getTabObject(tabIndex).id,
      sourceProcessId: this.$electron.remote.webContents.fromId(
        this.getBrowserView(tabIndex).webContents.id
      ).getOSProcessId(),
      sourceFrameId: 0,
      timeStamp: Date.now(),
      url: event.url,
      tabId: this.$store.getters.pid,
    });
  }
  */
  onOpenPDF(event: Electron.Event, data: any): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(data.webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          if (this.pdfViewer === 'pdf-viewer') {
            const parsedURL = urlPackage.parse(data.url, true);
            webContents.downloadURL(`${parsedURL.query.file}?skip=true`);
          } else {
            webContents.loadURL(data.url);
          }
        }
      }
    }
  }
  onWillDownloadAnyFile(event: Electron.Event, data: any): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(data.webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
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
    }
  }
  onUpdateDownloadsProgress(event: Electron.Event, data: any): void {
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
  onCompleteDownloadsProgress(event: Electron.Event, data: any): void {
    if (data.hostWebContentsId === this.windowWebContentsId) {
      this.$store.dispatch('completeDownloadsProgress', {
        name: data.name,
        startTime: data.startTime,
        dataState: data.dataState,
      });
      const completedDownload =
        this.$store.getters.downloads.filter(download => download.startTime === data.startTime);
      if (completedDownload.length) {
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
        // eslint-disable-next-line no-new
        new (window as any).Notification(option.title, option);
      } else {
        this.showDownloadBar =
          this.$store.getters.downloads.every(download => download.style === 'hidden')
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
          this.getBrowserView().webContents.goBack();
        }
        if (this.hnorm >= 1) {
          this.getBrowserView().webContents.goForward();
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
        } else if ((this.deltaX < 0 && !this.getBrowserView().webContents.canGoBack()) ||
          (this.deltaX > 0 && !this.getBrowserView().webContents.canGoForward())) {
          this.hnorm = 0;
          this.deltaX = 0;
        } else {
          this.hnorm = this.deltaX / SWIPE_TRIGGER_DIST;
        }
        this.hnorm = Math.min(1.0, Math.max(-1.0, this.hnorm));

        if (this.deltaX < 0) {
          leftSwipeArrow.style.left =
            `${((-1 * ARROW_OFF_DIST) - (this.hnorm * ARROW_OFF_DIST))}px`;
          rightSwipeArrow.style.right = `${(-1 * ARROW_OFF_DIST)}px`;
        }
        if (this.deltaX > 0) {
          leftSwipeArrow.style.left = `${(-1 * ARROW_OFF_DIST)}px`;
          rightSwipeArrow.style.right =
            `${((-1 * ARROW_OFF_DIST) + (this.hnorm * ARROW_OFF_DIST))}px`;
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
  onEnterFullscreen(): void {
    document.body.classList.add('fullscreen');
    const nav = this.$el.querySelector('#nav') as HTMLDivElement;
    if (nav) {
      nav.style.display = 'none';
      const view = this.getBrowserView();
      const bounds = view.getBounds();
      bounds.height =
        (this.$electron.remote.BrowserWindow.fromBrowserView(view)!.getSize() as any).height;
      view.setBounds(bounds);
    }
  }
  onLeaveFullscreen(): void {
    document.body.classList.remove('fullscreen');
    const nav = this.$el.querySelector('#nav') as HTMLDivElement;
    if (nav) {
      nav.style.display = 'block';
      const view = this.getBrowserView();
      const bounds = view.getBounds();
      bounds.height -= this.getNavAndStatusBarHeight();
      bounds.y += this.getNavAndStatusBarHeight();
    }
    if (this.htmlFullscreen) {
      this.onLeaveHtmlFullScreen();
    } else if (this.$electron.remote.BrowserWindow.fromId(this.windowId).isFullScreen()) {
      this.$electron.remote.BrowserWindow.fromId(this.windowId).setFullScreen(false);
    }
  }
  onContextMenu(event: { params: Electron.ContextMenuParams }): void {
    this.onWebviewContextMenu(event);
  }
  onWillNavigate(event: Electron.WillNavigateEvent, tabIndex: number, tabId: number): void {
    this.$store.dispatch('clearPageAction', {
      tabId,
      tabIndex,
      windowId: this.windowId,
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
  onGetSearchEngineProvider(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', {
            searchEngine: this.$store.getters.searchEngine,
            currentSearchEngine: this.$store.getters.currentSearchEngine,
            autoFetch: this.$store.getters.autoFetch,
          });
        }
      }
    }
  }
  onGetHomepage(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', {
            homepage: this.$store.getters.homepage,
          });
        }
      }
    }
  }
  onGetPDFViewer(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', {
            pdfViewer: this.$store.getters.pdfViewer,
          });
        }
      }
    }
  }
  onGetTabConfig(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', this.$store.getters.tabConfig);
        }
      }
    }
  }
  onGetLang(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', {
            lang: this.$store.getters.lang,
          });
        }
      }
    }
  }
  onGetProxyConfig(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', this.$store.getters.proxyConfig);
        }
      }
    }
  }
  onGetAuth(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', this.$store.getters.auth);
        }
      }
    }
  }
  onGetDownloads(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', this.$store.getters.downloads);
        }
      }
    }
  }
  onGetHistory(event: Electron.Event, webContentsId: number): void {
    const webContents: Electron.webContents | null =
      this.$electron.remote.webContents.fromId(webContentsId);
    if (webContents && webContents.getType() === 'browserView') {
      const browserView: Electron.BrowserView | null =
        this.$electron.remote.BrowserView.fromWebContents(webContents);
      if (browserView) {
        const currentWindow: Electron.BrowserWindow | null =
          this.$electron.remote.BrowserWindow.fromBrowserView(browserView);
        if (currentWindow && this.windowId === currentWindow.id) {
          webContents.send('guest-here-your-data', this.$store.getters.history);
        }
      }
    }
  }
  // tabHandlers
  onNewTab(windowId: number = this.windowId, url: string, follow = false): void {
    this.$store.dispatch('incrementTabId');
    if (url) {
      if (url.startsWith('about:')) {
        this.$store.dispatch('createTab', {
          windowId,
          isURL: true,
          follow: true,
          url: urlUtil.getUrlFromInput(url),
        });
        this.$electron.ipcRenderer.send('focus-window', this.windowId);
      } else {
        this.$store.dispatch('createTab', {
          windowId,
          url,
          follow,
          isURL: urlUtil.isURL(url),
        });
      }
    }
    setTimeout(
      () => {
        this.$store.dispatch('setTabsOrder', {
          windowId: this.windowId,
          tabsOrder: (this.$refs.tabs as Tabs).sortable.toArray(),
        });
        if (!(process.env.NODE_ENV === 'test' && process.env.TEST_ENV === 'unit')) {
          this.onCreatedEvent.emit(this.getTabObject(this.currentTabIndex));
        }
      },
      300
    );
  }
  onTabDuplicate(tabIndex: number): void {
    const tabObject: Lulumi.Store.TabObject = this.getTabObject(tabIndex);
    if (tabObject) {
      this.onNewTab(this.windowId, tabObject.url, true);
    }
  }
  onTabClick(tabIndex: number): void {
    let usedTabIndex = tabIndex;
    if (usedTabIndex === -1) {
      usedTabIndex = this.tabs.length - 1;
    }
    const tabObject: Lulumi.Store.TabObject = this.getTabObject(usedTabIndex);
    if (tabObject) {
      const tabId: number = tabObject.id;
      const tabTitle: string | null = tabObject.title;
      this.$store.dispatch('clickTab', {
        tabId,
        tabIndex: usedTabIndex,
        windowId: this.windowId,
      });
      if (tabTitle) {
        this.$electron.ipcRenderer.send('set-browser-window-title', {
          windowId: this.windowId,
          title: tabTitle,
        });
      }
    }
  }
  onTabClose(tabIndex: number): void {
    let usedTabIndex = tabIndex;
    if (usedTabIndex === -1) {
      usedTabIndex = this.tabs.length - 1;
    }
    const tabObject: Lulumi.Store.TabObject = this.getTabObject(usedTabIndex);
    if (tabObject) {
      const tabId: number = tabObject.id;
      this.onRemovedEvent.emit(tabObject);
      this.$store.dispatch('closeTab', {
        tabId,
        tabIndex: usedTabIndex,
        windowId: this.windowId,
      });
      setTimeout(
        () => this.$store.dispatch(
          'setTabsOrder',
          {
            windowId: this.windowId,
            tabsOrder: (this.$refs.tabs as Tabs).sortable.toArray(),
          }
        ),
        300
      );
    }
  }
  // navHandlers
  onClickHome(): void {
    this.getTab().navigateTo(this.homepage);
  }
  onClickBack(): void {
    if (this.getTabObject().error) {
      this.getBrowserView().webContents.goToOffset(-2);
    } else {
      this.getBrowserView().webContents.goBack();
    }
  }
  onClickForward(): void {
    this.getBrowserView().webContents.goForward();
  }
  onClickStop(): void {
    this.getBrowserView().webContents.stop();
  }
  onClickRefresh(): void {
    const view = this.getBrowserView();
    const url = urlUtil.getUrlIfError(this.tab.url);
    if (view.webContents.getURL() === url) {
      view.webContents.reload();
    } else {
      view.webContents.loadURL(url);
    }
  }
  onClickForceRefresh(): void {
    const view = this.getBrowserView();
    const url = urlUtil.getUrlIfError(this.tab.url);
    if (view.webContents.getURL() === url) {
      view.webContents.reloadIgnoringCache();
    } else {
      view.webContents.loadURL(url);
    }
  }
  onClickViewSource(): void {
    const webview = this.getBrowserView();
    const url = urlUtil.getUrlIfError(this.tab.url);
    if (webview.webContents.getURL() === url) {
      const sourceUrl = urlUtil.getViewSourceUrlFromUrl(url);
      if (sourceUrl !== null) {
        this.onNewTab(this.windowId, sourceUrl, true);
      }
    }
  }
  onClickToggleDevTools(): void {
    const webview = this.getBrowserView();
    const url = urlUtil.getUrlIfError(this.tab.url);
    if (webview.webContents.getURL() === url) {
      this.$electron.remote.webContents.fromId(
        webview.webContents.id
      ).openDevTools({ mode: 'bottom' });
    }
  }
  onClickJavaScriptPanel(): void {
    const webview = this.getBrowserView();
    const webContent = this.$electron.remote.webContents.fromId(webview.webContents.id);
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
    if (urlUtil.isNotURL(url)) {
      newUrl = this.$store.getters.currentSearchEngine.search.replace('{queryString}', url);
    } else {
      newUrl = url;
    }
    this.getTab().navigateTo(newUrl);
  }
  // onTabContextMenu
  onTabContextMenu(event: Electron.Event, tabIndex: number): void {
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const { Menu, MenuItem } = this.$electron.remote;
      const menu = new Menu();

      menu.append(new MenuItem({
        label: this.$t('tabs.contextMenu.newTab') as string,
        click: () => this.onNewTab(this.windowId, 'about:newtab', false),
      }));
      menu.append(new MenuItem({
        label: this.$t('tabs.contextMenu.duplicateTab') as string,
        click: () => {
          this.onTabDuplicate(tabIndex);
        },
      }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({
        label: this.$t('tabs.contextMenu.closeTab') as string,
        click: () => {
          this.onTabClose(tabIndex);
        },
      }));

      menu.popup({ window: currentWindow });
    }
  }
  // onClickBackContextMenu
  async onClickBackContextMenu(): Promise<void> {
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const menuItems: any = [];
      const view = this.getBrowserView();
      const webContents: any = this.$electron.remote.webContents.fromId(view.webContents.id);
      const navbar = document.getElementById('browser-navbar');
      const goBack = document.getElementById('browser-navbar__goBack');

      const current = webContents.getActiveIndex();
      const urls = webContents.history;

      const history = await this.historyMappings();

      if (goBack !== null && navbar !== null) {
        if (current <= urls.length - 1 && current !== 0) {
          for (let i = current - 1; i >= 0; i -= 1) {
            try {
              menuItems.push({
                type: 'base64',
                icon: history[urls[i]].icon,
                label: history[urls[i]].title,
                click: 'go-to-index',
                index: i,
              });
            } catch (e) {
              const regexp = new RegExp(/^lulumi(-extension)?:\/\/.+$/);
              const match = urls[i].match(regexp);
              if (match) {
                menuItems.push({
                  type: 'base64',
                  icon: constants.tabConfig.lulumiDefault.systemFavicon,
                  label: urls[i],
                  click: 'go-to-index',
                  index: i,
                });
              } else {
                menuItems.push({
                  label: urls[i],
                  click: 'go-to-index',
                  index: i,
                });
              }
            }
          }

          menuItems.push({ type: 'separator' });
          menuItems.push({
            label: this.$t('navbar.navigator.history') as string,
            click: 'open-history',
          });

          this.$electron.ipcRenderer.send('popup', {
            menuItems,
            windowId: currentWindow.id,
            x: Math.floor(goBack.getBoundingClientRect().left),
            y: Math.floor(navbar.getBoundingClientRect().bottom),
          });
        }
      }
    }
  }
  // onClickForwardContextMenu
  async onClickForwardContextMenu(): Promise<void> {
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const menuItems: any = [];
      const view = this.getBrowserView();
      const webContents: any = this.$electron.remote.webContents.fromId(view.webContents.id);
      const navbar = document.getElementById('browser-navbar');
      const goForward = document.getElementById('browser-navbar__goForward');

      const current = webContents.getActiveIndex();
      const urls = webContents.history;

      const history = await this.historyMappings();

      if (goForward !== null && navbar !== null) {
        if (current <= urls.length - 1 && current !== urls.length - 1) {
          for (let i = current + 1; i < urls.length; i += 1) {
            try {
              menuItems.push({
                type: 'base64',
                icon: history[urls[i]].icon,
                label: history[urls[i]].title,
                click: 'go-to-index',
                index: i,
              });
            } catch (e) {
              const regexp = new RegExp(/^lulumi(-extension)?:\/\/.+$/);
              const match = urls[i].match(regexp);
              if (match) {
                menuItems.push({
                  type: 'base64',
                  icon: constants.tabConfig.lulumiDefault.systemFavicon,
                  label: urls[i],
                  click: 'go-to-index',
                  index: i,
                });
              } else {
                menuItems.push({
                  label: urls[i],
                  click: 'go-to-index',
                  index: i,
                });
              }
            }
          }

          menuItems.push({ type: 'separator' });
          menuItems.push({
            label: this.$t('navbar.navigator.history') as string,
            click: 'open-history',
          });

          this.$electron.ipcRenderer.send('popup', {
            menuItems,
            windowId: currentWindow.id,
            x: Math.floor(goForward.getBoundingClientRect().left),
            y: Math.floor(navbar.getBoundingClientRect().bottom),
          });
        }
      }
    }
  }
  // onNavContextMenu
  onNavContextMenu(event: Electron.Event): void {
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const { Menu, MenuItem } = this.$electron.remote;
      const menu = new Menu();
      const { clipboard } = this.$electron;

      menu.append(new MenuItem({
        label: this.$t('navbar.contextMenu.cut') as string,
        role: 'cut',
      }));
      menu.append(new MenuItem({
        label: this.$t('navbar.contextMenu.copy') as string,
        click: () => {
          if (event.target) {
            clipboard.writeText((event.target as HTMLInputElement).value);
          }
        },
      }));
      menu.append(new MenuItem({
        label: this.$t('navbar.contextMenu.paste') as string,
        role: 'paste',
      }));
      menu.append(new MenuItem({
        label: this.$t('navbar.contextMenu.pasteAndGo') as string,
        click: () => {
          this.onEnterUrl(clipboard.readText());
        },
      }));

      menu.popup({ window: currentWindow });
    }
  }
  // onCommonMenu
  onCommonMenu(): void {
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const { Menu, MenuItem } = this.$electron.remote;
      const menu = new Menu();
      const navbar = document.getElementById('browser-navbar');
      const common = document.getElementById('browser-navbar__common');
      let sub: Electron.MenuItemConstructorOptions[] = [
        {
          label: this.$t('navbar.common.options.lulumi') as string,
          click: () => this.onNewTab(this.windowId, 'about:lulumi', false),
        },
      ];

      if (navbar !== null && common !== null) {
        if (is.windows) {
          menu.append(new MenuItem({
            label: this.$t('file.newTab') as string,
            accelerator: 'CmdOrCtrl+T',
            click: () => this.onNewTab(this.windowId, 'about:newtab', false),
          }));
          menu.append(new MenuItem({
            label: this.$t('file.newWindow') as string,
            accelerator: 'CmdOrCtrl+N',
            click: () => this.$electron.remote.BrowserWindow.createWindow(),
          }));
          menu.append(new MenuItem({ type: 'separator' }));
        }
        menu.append(new this.$electron.remote.MenuItem({
          label: this.$t('navbar.common.options.history.title') as string,
          submenu: ([
            {
              label: this.$t('navbar.common.options.history.history') as string,
              click: () => this.onNewTab(this.windowId, 'about:history', false),
            },
            { type: 'separator' },
            {
              label: this.$t('navbar.common.options.history.recentlyClosed') as string,
              enabled: false,
            },
          ] as Electron.MenuItemConstructorOptions[]).concat(this.historyMenuItem),
        }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.downloads') as string,
          click: () => this.onNewTab(this.windowId, 'about:downloads', false),
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.extensions') as string,
          click: () => this.onNewTab(this.windowId, 'about:extensions', false),
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.preferences') as string,
          click: () => this.onNewTab(this.windowId, 'about:preferences', false),
        }));
        if (is.windows) {
          sub = sub.concat([
            {
              label: this.$t('help.reportIssue') as string,
              click: () => this.onNewTab(
                this.windowId,
                'https://github.com/LulumiProject/lulumi-browser/issues',
                true
              ),
            },
            {
              label: this.$t('help.forceReload') as string,
              click: () => currentWindow.webContents.reloadIgnoringCache(),
            },
            {
              label: this.$t('help.toggleDevTools') as string,
              click: () => currentWindow.webContents.toggleDevTools(),
            },
            { type: 'separator' },
            {
              label: this.$t('window.processManager') as string,
              click: () => this.$electron.ipcRenderer.send('open-process-manager'),
            },
          ]);
        }
        menu.append(new MenuItem({
          label: this.$t('navbar.common.options.help') as string,
          submenu: sub,
        }));

        menu.popup({
          window: currentWindow,
          x: Math.floor(common.getBoundingClientRect().right),
          y: Math.floor(navbar.getBoundingClientRect().bottom),
        });
      }
    }
  }
  // onWebviewContextMenu
  onWebviewContextMenu(event: { params: Electron.ContextMenuParams }): void {
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const { Menu, MenuItem } = this.$electron.remote;
      const menu = new Menu();
      const { clipboard } = this.$electron;

      const view = this.getBrowserView();
      const tab = this.getTabObject();
      // eslint-disable-next-line prefer-destructuring
      const params = event.params;
      const { editFlags } = params;

      const registerExtensionContextMenus = (regMenu) => {
        const contextMenus = JSON.parse(JSON.stringify(this.contextMenus));
        Object.keys(contextMenus).forEach((webContentsIdInString) => {
          contextMenus[webContentsIdInString].forEach((menuItems) => {
            menuItems.forEach((regMenuItem) => {
              if (regMenuItem.type !== 'separator') {
                regMenuItem.label = regMenuItem.label.replace('%s', params.selectionText);
                regMenuItem.click = (self, browserWindow) => {
                  this.$electron.remote.webContents.fromId(self.webContentsId)
                    .send(
                      `lulumi-context-menus-clicked-${self.extensionId}-${self.id}`,
                      params,
                      this.getTabObject(this.currentTabIndex).id,
                      self,
                      browserWindow
                    );
                };
                const { submenu } = regMenuItem;
                if (submenu) {
                  submenu.forEach((sub) => {
                    sub.label.replace('%s', params.selectionText);
                    sub.click = (self, browserWindow) => {
                      this.$electron.remote.webContents.fromId(sub.webContentsId)
                        .send(
                          `lulumi-context-menus-clicked-${sub.extensionId}-${sub.id}`,
                          params,
                          this.getTabObject(this.currentTabIndex).id,
                          self,
                          browserWindow
                        );
                    };
                  });
                }
              }
            });
            Menu.buildFromTemplate(menuItems).items
              .forEach(menuItem => regMenu.append(menuItem));
          });
        });
        if (Object.keys(contextMenus).length !== 0) {
          regMenu.append(new MenuItem({ type: 'separator' }));
        }
      };

      if (params.selectionText) {
        if (is.macos) {
          menu.append(new MenuItem({
            label: this.$t(
              'webview.contextMenu.lookUp', { selectionText: params.selectionText }
            ) as string,
            click: () => {
              view.webContents.showDefinitionForSelection();
            },
          }));

          menu.append(new MenuItem({ type: 'separator' }));
        }

        if (editFlags.canCopy) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.copy') as string,
            role: 'copy',
          }));
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.searchFor', {
              selectionText: params.selectionText,
              searchEngine: this.$store.getters.currentSearchEngine.name,
            }) as string,
            click: () => this.onNewTab(this.windowId, params.selectionText, false),
          }));

          menu.append(new MenuItem({ type: 'separator' }));
        }
      }
      if (params.isEditable) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.undo') as string,
          click: () => {
            view.webContents.undo();
          },
          enabled: editFlags.canUndo,
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.redo') as string,
          click: () => {
            view.webContents.redo();
          },
          enabled: editFlags.canRedo,
        }));

        menu.append(new MenuItem({ type: 'separator' }));

        if (editFlags.canCut) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.cut') as string,
            role: 'cut',
          }));
        }

        if (editFlags.canCopy) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.copy') as string,
            role: 'copy',
          }));
        }

        if (editFlags.canPaste) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.paste') as string,
            role: 'paste',
          }));
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.pasteAndMatchStyle') as string,
            role: 'pasteAndMatchStyle',
          }));
        }

        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.selectAll') as string,
          role: 'selectAll',
        }));
      } else if (params.linkURL) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.openLinkInNewTab') as string,
          click: () => this.onNewTab(this.windowId, params.linkURL, false),
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.openLinkInNewWindow') as string,
          click: () => {
            this.$electron.remote.webContents.fromId(
              view.webContents.id
            ).executeJavaScript(`window.open('${params.linkURL}')`);
          },
        }));

        menu.append(new MenuItem({ type: 'separator' }));

        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.copyLinkAddress') as string,
          click: () => {
            clipboard.writeText(params.linkURL);
          },
        }));
      } else if (params.hasImageContents) {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.openImageInNewTab') as string,
          click: () => this.onNewTab(this.windowId, params.srcURL, false),
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.saveImageAs') as string,
          click: async () => {
            const fs = require('fs');
            const electron = this.$electron;
            const filename = await urlUtil.getFilenameFromUrl(params.srcURL);
            const defaultPath = path.join(electron.remote.app.getPath('downloads'), filename);
            const result = await electron.remote.dialog.showSaveDialog(
              currentWindow,
              {
                defaultPath,
                filters: [
                  {
                    name: 'Images',
                    extensions: ['jpg', 'jpeg', 'png', 'gif'],
                  },
                ],
              },
            );
            if (!result.canceled) {
              const dataURL = await imageUtil.getBase64FromImageUrl(params.srcURL);
              fs.writeFileSync(
                result.filePath, electron.nativeImage.createFromDataURL(dataURL).toPNG()
              );
            }
          },
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.copyImage') as string,
          click: () => {
            const electron = this.$electron;
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
          label: this.$t('webview.contextMenu.copyImageUrl') as string,
          click: () => {
            clipboard.writeText(params.srcURL);
          },
        }));
      } else {
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.back') as string,
          click: () => {
            this.onClickBack();
          },
          enabled: tab.canGoBack,
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.forward') as string,
          click: () => {
            this.onClickForward();
          },
          enabled: tab.canGoForward,
        }));
        menu.append(new MenuItem({
          label: this.$t('webview.contextMenu.reload') as string,
          click: () => {
            this.onClickRefresh();
          },
          enabled: tab.canRefresh,
        }));
      }

      menu.append(new MenuItem({ type: 'separator' }));

      // lulumi.contextMenus
      registerExtensionContextMenus(menu);

      const url = urlUtil.getUrlIfError(tab.url);
      if (view.webContents.getURL() === url) {
        const sourceUrl = urlUtil.getViewSourceUrlFromUrl(url);
        if (sourceUrl !== null) {
          menu.append(new MenuItem({
            label: this.$t('webview.contextMenu.viewSource') as string,
            click: this.onClickViewSource,
          }));
        }
      }
      menu.append(new MenuItem({
        label: this.$t('webview.contextMenu.javascriptPanel') as string,
        click: this.onClickJavaScriptPanel,
      }));
      menu.append(new MenuItem({
        label: this.$t('webview.contextMenu.inspectElement') as string,
        click: () => {
          view.webContents.inspectElement(params.x, params.y);
        },
      }));

      menu.popup({ window: currentWindow });
    }
  }

  beforeMount(): void {
    const ipc = this.$electron.ipcRenderer;

    if (!(process.env.NODE_ENV === 'test' && process.env.TEST_ENV === 'unit')) {
      const windowProperty = ipc.sendSync('window-id');
      this.windowId = windowProperty.windowId;
      this.windowWebContentsId = windowProperty.windowWebContentsId;

      ipc.once(
        `new-tab-suggestion-for-window-${this.windowId}`,
        (event: Electron.Event, suggestion: Lulumi.Main.BrowserWindowSuggestionItem | null) => {
          if (suggestion !== null && this.tabs.length === 0) {
            this.onNewTab(this.windowId, suggestion.url, suggestion.follow);
          }
        }
      );
      // we have to call ipc.send anyway in order to cancel/trigger the corresponding event listener
      ipc.send(`any-new-tab-suggestion-for-window-${this.windowId}`);
    } else {
      this.windowId = 0;

      if (this.tabs.length === 0) {
        this.onNewTab(this.windowId, 'about:newtab', true);
      }
    }

    this.extensionService = new ExtensionService(this);
  }
  mounted(): void {
    if (is.macos) {
      document.body.classList.add('darwin');
    }

    const ipc = this.$electron.ipcRenderer;

    ipc.on('browser-view-did-start-loading', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-did-navigate', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-page-title-updated', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-dom-ready', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-did-frame-finish-load', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-page-favicon-updated', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-did-stop-loading', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-did-fail-load', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-ipc-message', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-update-target-url', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-media-started-playing', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-media-paused', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-enter-html-full-screen', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-leave-html-full-screen', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-new-window', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-context-menu', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('browser-view-will-navigate', (event, data) => {
      const eventHandler: string = data.eventName;
      const { tabId, tabIndex }: { tabId: number; tabIndex: number } = data;

      if (this[eventHandler]) {
        this[eventHandler](data.event, tabIndex, tabId);
      }
    });
    ipc.on('reset-zoom', () => {
      this.$electron.remote.webContents.fromId(
        this.getBrowserView().webContents.id
      ).setZoomLevel(0);
    });
    ipc.on('zoom-in', () => {
      const webContents = this.$electron.remote.webContents.fromId(
        this.getBrowserView().webContents.id
      );
      const zoomLevel = webContents.getZoomLevel();
      webContents.setZoomLevel(zoomLevel + 0.5);
    });
    ipc.on('zoom-out', () => {
      const webContents = this.$electron.remote.webContents.fromId(
        this.getBrowserView().webContents.id
      );
      const zoomLevel = webContents.getZoomLevel();
      webContents.setZoomLevel(zoomLevel - 0.5);
    });
    ipc.on('go-back', () => {
      this.onClickBack();
    });
    ipc.on('go-forward', () => {
      this.onClickForward();
    });
    ipc.on('go-to-index', (event, index) => {
      const view = this.getBrowserView();
      view.webContents.goToIndex(index);
    });
    ipc.on('open-history', () => {
      this.onNewTab(this.windowId, 'about:history', false);
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
    ipc.on('restore-recently-closed-tab', () => {
      if (this.historyMenuItem.length > 0) {
        // trigger manually without filling with expected arguments
        (this.historyMenuItem[0] as any).click();
      }
    });
    ipc.on('tab-close', () => {
      if (this.currentTabIndex !== undefined) {
        this.onTabClose(this.currentTabIndex);
      }
    });
    ipc.on('tab-click', (event: Electron.Event, tabIndexThatWeSee: number) => {
      const els = document.querySelectorAll('.tab') as NodeListOf<HTMLDivElement>;
      const el = (tabIndexThatWeSee === -1)
        ? els[els.length - 1]
        : els[tabIndexThatWeSee];
      if (el) {
        el.click();
      }
    });
    ipc.on(
      'tab-select',
      (event: Electron.Event, direction: 'next' | 'previous') => {
        const els: HTMLDivElement[] = [].slice.call(
          document.querySelectorAll('.tab')
        );
        const el = document.querySelector('.active');
        if (el) {
          const elIndex: number = els.findIndex(ele => ele.id === el.id);
          if (elIndex !== -1) {
            if (direction === 'next') {
              if (elIndex < els.length - 1) {
                els[elIndex + 1].click();
              } else {
                els[0].click();
              }
            } else if (direction === 'previous') {
              if (elIndex > 0) {
                els[elIndex - 1].click();
              } else {
                els[els.length - 1].click();
              }
            }
          }
        }
      }
    );
    ipc.on('escape-full-screen', () => {
      this.onLeaveHtmlFullScreen();
    });
    ipc.on('start-find-in-page', () => {
      // this.getTab(this.currentTabIndex).findInPage();
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
    ipc.on('enter-full-screen', () => {
      this.onEnterFullscreen();
    });
    ipc.on('leave-full-screen', () => {
      this.onLeaveFullscreen();
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
    ipc.on('get-homepage', (event: Electron.Event, webContentsId: number) => {
      this.onGetHomepage(event, webContentsId);
    });
    ipc.on('get-pdf-viewer', (event: Electron.Event, webContentsId: number) => {
      this.onGetPDFViewer(event, webContentsId);
    });
    ipc.on('get-tab-config', (event: Electron.Event, webContentsId: number) => {
      this.onGetTabConfig(event, webContentsId);
    });
    ipc.on('get-lang', (event: Electron.Event, webContentsId: number) => {
      this.onGetLang(event, webContentsId);
    });
    ipc.on('get-proxy-config', (event: Electron.Event, webContentsId: number) => {
      this.onGetProxyConfig(event, webContentsId);
    });
    ipc.on('get-auth', (event: Electron.Event, webContentsId: number) => {
      this.onGetAuth(event, webContentsId);
    });
    ipc.on('get-downloads', (event: Electron.Event, webContentsId: number) => {
      this.onGetDownloads(event, webContentsId);
    });
    ipc.on('get-history', (event: Electron.Event, webContentsId: number) => {
      this.onGetHistory(event, webContentsId);
    });

    ipc.on('remove-non-bg-lulumi-extension', (event: Electron.Event, extensionId: string) => {
      ipc.send(`remove-lulumi-extension-${extensionId}`);
    });
    ipc.on('about-to-quit', async () => {
      const currentWindow: Electron.BrowserWindow | null =
        this.$electron.remote.BrowserWindow.fromId(this.windowId);
      const { downloads } = this.$store.getters;
      const pendingDownloads = downloads.filter(download => download.state === 'progressing');

      if (pendingDownloads.length !== 0) {
        const result = await this.$electron.remote.dialog.showMessageBox(
          currentWindow,
          {
            type: 'warning',
            title: 'Warning',
            message: 'You still have some files progressing.',
            buttons: ['Abort and Leave', 'Cancel'],
          },
        );
        if (result.response === 0) {
          pendingDownloads.forEach((download) => {
            this.$electron.ipcRenderer.send('cancel-downloads-progress', download.startTime);
          });
          ipc.send('okay-to-quit', true);
        } else {
          ipc.send('okay-to-quit', false);
        }
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
}
</script>

<style lang="less" scoped>
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

#notification {
  width: 100vw;
  height: 36px;
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

#nav {
  width: 100vw;
}

#footer {
  bottom: 22px;
  position: absolute;

  .browser-tab-status {
    transition-property: max-width;
    background: #F3F3F3;
    border-color: #d3d3d3;
    border-style: solid;
    border-width: 1px 1px 0 0;
    border-top-right-radius: 4px;
    bottom: 0;
    color: #555555;
    font-size: 12px;
    float: left;
    width: auto;
    max-width: 95vw;
    overflow-x: hidden;
    padding: 0.1em 0.5em;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    user-select: none;
  }

  .extend-enter-active {
    transition-property: max-width;
    transition-duration: 1s;
    max-width: 40vw;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
