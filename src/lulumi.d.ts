// *.vue
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

declare module 'lulumi' {
  export namespace scheme {
    // lulumi:// scheme
    export interface LulumiObject extends Object {
      lulumi: object[];
      preferences: string[][];
      about: string[][];
    }
  }

  export namespace api {
    // extension api
    export interface BackgroundPageObject {
      html: Buffer;
      name: string;
      webContentsId: number;
    }
    export interface BackgroundPages {
      [index: string]: BackgroundPageObject | undefined;
    }
    export interface ManifestObject extends chrome.runtime.Manifest {
      extensionId: string;
      manifest_version?: string;
      version?: string;
    }
    export interface ManifestMap {
      [index: string]: ManifestObject | undefined;
    }
    export interface ManifestNameMap {
      [index: string]: ManifestObject | undefined;
    }
    export interface GlobalObject extends NodeJS.Global {
      online: boolean;
      __static: string;
      renderProcessPreferences: any[];
      backgroundPages: BackgroundPages;
      manifestMap: ManifestMap;
      manifestNameMap: ManifestNameMap;
      guestData: LulumiObject;
    }
    export interface CustomBrowserWindow extends Electron.BrowserWindow {
      addLulumiExtension(srcDirectory: string): void;
    }
  }

  export namespace store {
    // store
    export interface PageObject {
      pid: number;
      windowId: number;
      location: string;
      statusText: boolean;
      favicon: string | null;
      title: string | null;
      isLoading: boolean;
      isSearching: boolean;
      canGoBack: boolean;
      canGoForward: boolean;
      canRefresh: boolean;
      error: boolean;
      hasMedia: boolean;
      isAudioMuted: boolean;
      pageActionMapping: object;
    }
    export interface TabConfig {
      dummyPageObject: PageObject;
      defaultFavicon: string;
      lulumiFavicon: string;
    }
    export interface SearchEngineObject {
      name: string;
      search: string;
      autocomplete: string;
    }
    export interface LastOpenedTabObject {
      title: string;
      location: string;
      favicon: string | null;
    }
    export interface LulumiBrowserWindowProperty extends Electron.BrowserWindowConstructorOptions {
      windowId: number;
      focused: boolean;
      state: string;
    }
    export interface State {
      pid: number;
      pages: PageObject[];
      tabsOrder: number[][];
      currentTabIndexes: number[];
      searchEngine: SearchEngineObject[];
      currentSearchEngine: SearchEngineObject;
      homepage: string;
      pdfViewer: string;
      tabConfig: TabConfig;
      lang: string;
      downloads: object[];
      history: object[];
      permissions: object;
      mappings: number[];
      lastOpenedTabs: LastOpenedTabObject[];
      windows: LulumiBrowserWindowProperty[];
    }
  }

  export namespace renderer {
    // src/renderer/js
    export interface SuggestionItem {
      title?: string;
      value: string;
      location: string;
      icon: string;
    }
    export interface SuggestionMatch {
      indices: number[];
      key: string;
    }
    export interface SuggestionObject {
      item: SuggestionItem;
      matches?: SuggestionMatch[];
    }
    export interface AboutLocationObject {
      title: string;
      url: string;
    }
  }

  export namespace browserMainView {
    // BrowserMainView.vue
    export interface Alarm {
      handler: any;
      periodInMinutes?: number;
    }
    export interface AlarmArray {
      [index: string]: Alarm | undefined;
    }
  }

  export namespace page {
    // Page.vue
    export interface FindInPageObject {
      container?: HTMLElement;
      input: HTMLElement;
      counter: HTMLElement;
      previous: HTMLElement;
      next: HTMLElement;
      endButton: HTMLElement;
      activeWebview: Electron.WebviewTag;
      start(): void;
      end(): void;
    }
  }

  export namespace navbar {
    // Navbar.vue
    export interface BadgeTextArray {
      [index: string]: string[] | undefined;
    }
    export interface BadgeBackgroundColorArray {
      [index: string]: string[] | undefined;
    }
  }
}
