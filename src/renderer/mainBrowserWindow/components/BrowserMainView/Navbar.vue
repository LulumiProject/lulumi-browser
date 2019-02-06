<template lang="pug">
#browser-navbar
  .control-group
    a(@click="$parent.onClickHome", class="enabled")
      iview-icon(type="md-home", size="16")
    a(id="browser-navbar__goBack", @click="$parent.onClickBack", @contextmenu="$parent.onClickBackContextMenu()", @mousedown="onGoBackMouseDown", @mouseup="onGoBackMouseUp", :class="tab.canGoBack ? 'enabled' : 'disabled'")
      iview-icon(type="md-arrow-round-back", size="16")
    a(id="browser-navbar__goForward", @click="$parent.onClickForward", @contextmenu="$parent.onClickForwardContextMenu()", @mousedown="onGoForwardMouseDown", @mouseup="onGoForwardMouseUp", :class="tab.canGoForward ? 'enabled' : 'disabled'")
      iview-icon(type="md-arrow-round-forward", size="16")
    a(v-if="tab.isLoading", id="browser-navbar__stop", @click="$parent.onClickStop", class="enabled")
      iview-icon(type="md-close", size="16")
    a(v-else, @click="$parent.onClickRefresh", id="browser-navbar__refresh", :class="tab.canRefresh ? 'enabled' : 'disabled'")
      iview-icon(type="md-refresh", size="16")
  .input-group
    good-custom-autocomplete#url-input(ref="input",
                                       @contextmenu.native="$parent.onNavContextMenu",
                                       @keyup.shift.up.native="selectPortion",
                                       @keyup.shift.down.native="selectPortion",
                                       @input="onChange",
                                       @focus="onFocus",
                                       @blur="onBlur",
                                       @select="onSelect",
                                       :trigger-on-focus="false",
                                       :placeholder="$t('navbar.placeholder')",
                                       :fetch-suggestions="querySearch",
                                       :value="value",
                                       popper-class="my-autocomplete",
                                       :debounce="0")
      el-button(slot="prepend")
        div.secure(v-if="secure")
          awesome-icon(name="lock")
          span {{ $t('navbar.indicator.secure') }}
        div.insecure(v-else)
          awesome-icon(name="unlock")
          span {{ $t('navbar.indicator.insecure') }}
      template(slot-scope="props")
        component(:is="'suggestion-item'", :item="props.item")
  .extensions-group(v-sortable="")
    div.block(v-for="extension in extensions",
              :key="extension.extensionId")
      el-popover(:ref="`popover-${extension.extensionId}`",
                 placement="bottom-end",
                 trigger="click",
                 :visible-arrow="false",
                 :disabled="showPopupOrNot(extension)",
                 :popper-options={ gpuAcceleration: true })
        el-badge.badge(:ref="`badge-${extension.extensionId}`",
                        :value="showBrowserActionBadgeText(extension.extensionId)",
                        :background="showBrowserActionBadgeBackgroundColor(extension.extensionId)",
                        @click.native="sendIPC($event, extension)",
                        @contextmenu.native="onContextmenu(extension)",
                        slot="reference")
          img.extension(v-if="(extension !== undefined) && (loadIcon(extension) !== undefined)",
                        :src="loadIcon(extension)",
                        :class="showOrNot(extension)",
                        :title="showTitle(extension)")
        webview.extension(:ref="`webview-${extension.extensionId}`",
                          webpreferences="nativeWindowOpen=1",
                          allowpopups="")
  .common-group
    a(id="browser-navbar__common", @click="$parent.onCommonMenu", class="enabled")
      iview-icon(type="md-more", size="22")
</template>

<script lang="ts">
import { Component, Watch, Vue } from 'vue-property-decorator';

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

import AwesomeIcon from 'vue-awesome/components/Icon.vue';
import 'vue-awesome/icons/lock';
import 'vue-awesome/icons/unlock';

import Workerize from 'workerize';
import Sortable from 'sortablejs';

import { Badge, Button, Popover } from 'element-ui';
import IViewIcon from 'iview/src/components/icon';

import Event from '../../../api/event';

import '../../css/el-autocomplete';
import '../../css/el-badge';
import '../../css/el-input';
import urlUtil from '../../../lib/url-util';
import config from '../../constants';

import BrowserMainView from '../BrowserMainView.vue';

Vue.component('suggestion-item', {
  functional: true,
  render(h, ctx) {
    const suggestion: Lulumi.Renderer.SuggestionObject = ctx.props.item;
    const item: Lulumi.Renderer.SuggestionItem = suggestion.item;
    if (item.title) {
      if (suggestion.matches) {
        let renderElementsOfTitle: any[] = [];
        let renderElementsOfValue: any[] = [];
        suggestion.matches.forEach((match) => {
          const renderElements: any[] = [];
          const key: string = match.key;
          const tmpStr: string = item[key];
          let prefixIndex: number = 0;
          match.indices.forEach((indexPair, index) => {
            const prefix: string = tmpStr.substring(prefixIndex, indexPair[0]);
            const target: string = tmpStr.substring(indexPair[0], indexPair[1] + 1);

            renderElements.push(prefix);
            renderElements.push(h('span', { style: { color: '#499fff' } }, target));
            prefixIndex = indexPair[1] + 1;
            if (index === match.indices.length - 1) {
              renderElements.push(tmpStr.substring(prefixIndex, tmpStr.length));
            }
          });
          if (renderElements.length === 0) {
            renderElements.push(tmpStr);
          }
          if (key === 'title') {
            renderElementsOfTitle = renderElements;
          } else  if (key === 'value') {
            renderElementsOfValue = renderElements;
          }
        });
        if (renderElementsOfTitle.length === 0) {
          renderElementsOfTitle.push(item.title);
        } else if (renderElementsOfValue.length === 0) {
          renderElementsOfValue.push(item.value);
        }
        return h('div', { attrs: { class: 'url' } }, [
          h('i', { attrs: { class: `el-icon-${item.icon}`, style: 'padding-right: 10px;' } }),
          h('span', renderElementsOfValue),
          h('span', { attrs: { class: 'name' } }, [
            ' - ',
            ...renderElementsOfTitle,
          ]),
        ]);
      }
      return h('div', { attrs: { class: 'url' } }, [
        h('i', { attrs: { class: `el-icon-${item.icon}`, style: 'padding-right: 10px;' } }),
        h('span', item.value),
        h('span', { attrs: { class: 'name' } }, [
          ' - ',
          item.title,
        ]),
      ]);
    }
    return h('div', { attrs: { class: 'url' } }, [
      h('i', { attrs: { class: `el-icon-${item.icon}`, style: 'padding-right: 10px;' } }),
      h('span', item.value),
    ]);
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
});

@Component({
  directives: {
    sortable: {
      update(el) {
        Sortable.create(el, {
          draggable: '.block',
          animation: 150,
        });
      },
    },
  },
  props: {
    windowId: {
      type: Number,
      required: true,
    },
  },
  components: {
    'awesome-icon': AwesomeIcon,
    'el-badge': Badge,
    'el-button': Button,
    'el-popover': Popover,
    'iview-icon': IViewIcon,
  },
})
export default class Navbar extends Vue {
  handler: any;
  clickHandler: any;
  blurHandler: any;
  secure: boolean = false;
  focused: boolean = false;
  value: string = '';
  suggestionItems: Lulumi.Renderer.SuggestionItem[] = config.recommendTopSite;
  extensions: Lulumi.API.ManifestObject[] = [];
  onbrowserActionClickedEvent: Event = new Event();
  onpageActionClickedEvent: Event = new Event();

  windowId: number;

  get dummyTabObject(): Lulumi.Store.TabObject {
    return this.$store.getters.tabConfig.dummyTabObject;
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
  get autoFetch(): boolean {
    return this.$store.getters.autoFetch;
  }
  get pageActionMapping(): object {
    if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
      return {};
    }
    return this.tabs[this.currentTabIndex].pageActionMapping;
  }
  get certificates(): Lulumi.Store.Certificates {
    return this.$store.getters.certificates;
  }
  get url(): string {
    if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
      return '';
    }
    return this.tabs[this.currentTabIndex].url;
  }
  get currentSearchEngine(): Lulumi.Store.SearchEngineObject {
    return this.$store.getters.currentSearchEngine;
  }
  get suggestionItemsByHistory(): any {
    const suggestionItems: Lulumi.Renderer.SuggestionItem[] = [];
    const regex = new RegExp('(^\w+:|^)\/\/');
    this.$store.getters.history.forEach((history) => {
      const part: string = history.url.replace(regex, '');
      suggestionItems.push({
        title: history.title,
        value: part,
        url: part,
        icon: 'document',
      });
    });
    return suggestionItems;
  }

  @Watch('url')
  onUrl(newUrl: string): void {
    this.showUrl(newUrl, this.tab.id);
    if (!(process.env.NODE_ENV === 'test'
      && process.env.TEST_ENV === 'unit')) {
      (document.querySelector('.my-autocomplete') as HTMLDivElement)
        .style.display = 'none';
    }
    (this.$refs.input as any).suggestions.length = 0;
  }
  @Watch('focused')
  onFocused(isFocus: boolean): void {
    setTimeout(
      () => {
        if (!isFocus) {
          (document.querySelector('.my-autocomplete') as HTMLDivElement)
            .style.display = 'none';
          (this.$refs.input as any).suggestions.length = 0;
        }
      },
      200);
  }

  chunk(r: any[], j: number): any[][] {
    return r.reduce((a,b,i,g) => !(i % j) ? a.concat([g.slice(i,i+j)]) : a, []);
  }
  updateOmnibox(newUrl: string): void {
    if (!this.focused) {
      if (newUrl === 'about:newtab') {
        this.secure = true;
        this.value = '';
        const newElement = document.getElementById('security-indicator');
        if (newElement) {
          newElement.click();
        }
        return;
      }
      let tmp = '';
      const currentUrl = url.parse(newUrl, true);
      const originalInput = document.querySelector('.el-input__inner') as HTMLInputElement;
      const newElement = document.getElementById('security-indicator');
      if (newElement && currentUrl.href && currentUrl.protocol) {
        if (currentUrl.protocol === 'https:' || currentUrl.protocol === 'wss:') {
          const hint = this.secure ? 'secure' : 'insecure';
          tmp = `
            <div class="security-hint">
              <span class="${hint}-origin">${currentUrl.protocol}</span>
              <span>${currentUrl.href.substr(currentUrl.protocol.length)}</span>
            </div>
          `;
        } else {
          tmp = `
            <div class="security-hint">
              <span>${currentUrl.protocol}</span>
              <span>${currentUrl.href.substr(currentUrl.protocol.length)}</span>
            </div>
          `;
        }
        originalInput.style.display = 'none';
        newElement.innerHTML = tmp;
        newElement.style.display = 'block';

        newElement.removeEventListener('click', this.clickHandler, false);
        originalInput.removeEventListener('blur', this.blurHandler, false);
        newElement.addEventListener('click', this.clickHandler);
        originalInput.addEventListener('blur', this.blurHandler);
      }
    }
  }
  updateSecure(url: string): void {
    const scheme = urlUtil.getScheme(url);
    if (scheme === 'lulumi://') {
      this.secure = true;
      return;
    }
    if (scheme === 'https://' || scheme === 'wss://') {
      const hostname = urlUtil.getHostname(url);
      if (hostname) {
        const key
          = Object.keys(this.certificates).filter(key => key.includes(hostname))
          .find((el) => {
            const rule
              = new RegExp(`^(www\\.)?${el.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
            return rule.test(hostname);
          });
        const certificateObject = (key === undefined)
          ? undefined
          : this.certificates[key];
        if (certificateObject) {
          this.secure = (certificateObject.verificationResult === 'net::OK');
          return;
        }
      }
    }
    this.secure = false;
  }
  showCertificate(): void {
    const ipc = this.$electron.ipcRenderer;
    const hostname = urlUtil.getHostname(this.url);
    if (hostname) {
      const certificateObject = this.certificates[hostname];
      if (certificateObject) {
        ipc.send(
          'show-certificate',
          certificateObject.certificate,
          `${hostname}\n${certificateObject.verificationResult}`);
      }
    }
  }
  selectPortion(event): void {
    const code: string = event.code;
    const el = event.target;
    if (code === 'ArrowUp') {
      el.selectionEnd = el.selectionStart;
      el.selectionStart = 0;
    } else if (code === 'ArrowDown') {
      el.selectionEnd = el.value.length;
    }
  }
  unique(suggestions: Lulumi.Renderer.SuggestionObject[]): Lulumi.Renderer.SuggestionObject[] {
    const newSuggestions: Lulumi.Renderer.SuggestionObject[] = [];
    const seen: Set<string> = new Set();

    suggestions.forEach((suggestion) => {
      if (!seen.has(`${suggestion.item.icon}:${suggestion.item.url}`)) {
        seen.add(`${suggestion.item.icon}:${suggestion.item.url}`);
        newSuggestions.push(suggestion);
      }
    });
    return newSuggestions;
  }
  showUrl(url: string, tabId: number): void {
    if (tabId === this.tab.id) {
      this.updateSecure(url);
      if (this.focused || url.startsWith('lulumi-extension')) {
        return;
      }
      let newUrl = decodeURIComponent(url);
      newUrl = urlUtil.getUrlIfError(newUrl);
      newUrl = urlUtil.getUrlIfPDF(newUrl);
      this.value = urlUtil.getUrlIfAbout(newUrl).url;
      this.updateOmnibox(this.value);
    }
  }
  onGoBackMouseDown(): void {
    this.handler
      = setTimeout(() => (this.$parent as BrowserMainView).onClickBackContextMenu(), 300);
  }
  onGoForwardMouseDown(): void {
    this.handler
      = setTimeout(() => (this.$parent as BrowserMainView).onClickForwardContextMenu(), 300);
  }
  onGoBackMouseUp(): void {
    if (this.handler) {
      clearTimeout(this.handler);
    }
  }
  onGoForwardMouseUp(): void {
    if (this.handler) {
      clearTimeout(this.handler);
    }
  }
  onChange(val: string): void {
    this.value = val;
  }
  onFocus(): void {
    this.focused = true;
  }
  onBlur(): void {
    this.focused = false;
  }
  onSelect(event: Lulumi.Renderer.SuggestionObject): void {
    const item: Lulumi.Renderer.SuggestionItem = event.item;
    this.focused = false;
    if (item.title === `${this.currentSearchEngine.name} ${this.$t('navbar.search')}`) {
      (this.$parent as BrowserMainView).onEnterUrl(
        this.currentSearchEngine.search.replace('{queryString}', encodeURIComponent(item.url)));
    } else {
      (this.$parent as BrowserMainView).onEnterUrl(item.url);
    }
  }
  async querySearch(queryString: string, cb: Function): Promise<void> {
    const ipc = this.$electron.ipcRenderer;
    const currentSearchEngine: string = this.currentSearchEngine.name;
    const navbarSearch = this.$t('navbar.search');
    let suggestions: Lulumi.Renderer.SuggestionObject[] = [];
    this.suggestionItems.forEach(item => suggestions.push({ item }));
    if (queryString) {
      suggestions = suggestions.filter(this.createFilter(queryString));
    }
    suggestions.push({
      item: {
        title: `${currentSearchEngine} ${this.$t('navbar.search')}`,
        value: this.value,
        url: this.value,
        icon: 'search',
      },
    });
    if (suggestions.length === 1 && urlUtil.isURL(this.value)) {
      suggestions.unshift({
        item: {
          value: this.value,
          url: this.value,
          icon: 'document',
        },
      });
    }

    const worker = Workerize(`
      // Ref: https://github.com/webpack/webpack/issues/1554#issuecomment-336462319
      ${fs.readFileSync(__non_webpack_require__.resolve('fuse.js'), 'utf8')}
      export function search(suggestionItems, niddle) {
        const fuse = new Fuse(suggestionItems, {
          shouldSort: true,
          threshold: 0.4,
          includeMatches: true,
          keys: [{
            name: 'value',
            weight: 0.7,
          }, {
            name: 'title',
            weight: 0.3,
          }],
        });
        return fuse.search(niddle);
      }
    `);

    // calling out fuse results using web workers
    const entries: Lulumi.Renderer.SuggestionObject[][]
      = await Promise.all(this.chunk(this.suggestionItemsByHistory, 10)
        .map(suggestionItem => worker.search(suggestionItem, queryString.toLowerCase()))) as any;
    if (entries.length !== 0) {
      entries.reduce((a, b) => a.concat(b)).forEach(entry => suggestions.push(entry));
    }

    if (this.autoFetch && this.currentSearchEngine.autocomplete !== '') {
      const timestamp: number = Date.now();
      // autocomplete suggestions
      ipc.once(`fetch-search-suggestions-${timestamp}`, (event, result) => {
        if (result.ok) {
          const parsed = JSON.parse(result.body);
          const returnedSuggestions = (parsed[1] !== undefined)
            ? parsed[1]
            : parsed.items;
          returnedSuggestions.forEach((suggestion) => {
            suggestions.push({
              item: {
                title: `${currentSearchEngine} ${navbarSearch}`,
                value: suggestion,
                url: suggestion,
                icon: 'search',
              },
            });
          });
        } else {
          // tslint:disable-next-line no-console
          console.error(result.error);
        }
        cb(this.unique(suggestions));
      });
      ipc.send(
        'fetch-search-suggestions',
        currentSearchEngine,
        this.currentSearchEngine.autocomplete
        .replace('{queryString}', this.value)
        .replace('{language}', this.$store.getters.lang),
        timestamp);
    } else {
      cb(this.unique(suggestions));
    }
  }
  createFilter(queryString: string): (suggestion: any) => boolean {
    return suggestion => (suggestion.item.value.indexOf(queryString.toLowerCase()) === 0);
  }
  extensionsMetadata(extensionId: string): Lulumi.Store.ExtensionMetadata | null {
    const extensionsMetadata = this.tab.extensionsMetadata;
    if (Object.keys(extensionsMetadata).length && extensionsMetadata[extensionId]) {
      return extensionsMetadata[extensionId];
    }
    return null;
  }
  setBrowserActionIcon(extensionId: string, iconInfo: Lulumi.API.IconInfo): void {
    this.$nextTick(() => {
      this.$store.dispatch('updateExtensionMetadata', {
        extensionId,
        tabId: (iconInfo.tabId) ? iconInfo.tabId : this.tab.id,
        browserActionIcon: iconInfo.url,
      });
    });
  }
  showBrowserActionIcon(extensionId: string): string {
    if (this.tab === this.dummyTabObject) {
      return '#';
    }
    const extensionMetadata = this.extensionsMetadata(extensionId);
    return (extensionMetadata !== null)
      ? extensionMetadata.browserActionIcon
      : '#';
  }
  setBrowserActionBadgeText(extensionId: string, details): void {
    this.$nextTick(() => {
      this.$store.dispatch('updateExtensionMetadata', {
        extensionId,
        tabId: (details.tabId) ? details.tabId : this.tab.id,
        badgeText: String(details.text),
      });
    });
  }
  showBrowserActionBadgeText(extensionId: string): string {
    if (this.tab === this.dummyTabObject) {
      return '';
    }
    const extensionMetadata = this.extensionsMetadata(extensionId);
    return (extensionMetadata !== null)
      ? extensionMetadata.badgeText
      : '';
  }
  setBrowserActionBadgeBackgroundColor(extensionId: string, details): void {
    this.$nextTick(() => {
      this.$store.dispatch('updateExtensionMetadata', {
        extensionId,
        tabId: (details.tabId) ? details.tabId : this.tab.id,
        badgeBackgroundColor: details.color,
      });
    });
  }
  showBrowserActionBadgeBackgroundColor(extensionId: string): void {
    if (this.tab === this.dummyTabObject) {
      return;
    }
    if (this.$refs[`badge-${extensionId}`] && this.$refs[`badge-${extensionId}`][0]) {
      const node = this.$refs[`badge-${extensionId}`][0].$el.childNodes[1];
      const extensionMetadata = this.extensionsMetadata(extensionId);
      const color = (extensionMetadata !== null)
        ? extensionMetadata.badgeBackgroundColor
        : '';
      if (node && color) {
        node.style.backgroundColor = color;
      }
    }
  }
  setPageActionIcon(extensionId: string, iconInfo: Lulumi.API.IconInfo): void {
    this.$nextTick(() => {
      this.$store.dispatch('updateExtensionMetadata', {
        extensionId,
        tabId: (iconInfo.tabId) ? iconInfo.tabId : this.tab.id,
        pageActionIcon: iconInfo.url,
      });
    });
  }
  showPageActionIcon(extensionId: string): string {
    if (this.tab === this.dummyTabObject) {
      return '#';
    }
    const extensionMetadata = this.extensionsMetadata(extensionId);
    return (extensionMetadata !== null)
      ? extensionMetadata.pageActionIcon
      : '#';
  }
  loadIcon(extension: any): string | undefined {
    try {
      const isPageAction = extension.page_action;
      const isBrowserAction = extension.browser_action;
      const manifestIcon = extension.icons;
      let icons = false;
      if (isPageAction) {
        const icon = this.showPageActionIcon(extension.extensionId);
        if (icon !== '#') {
          return icon;
        }
        icons = extension.page_action.default_icon;
      }
      if (isBrowserAction) {
        const icon = this.showBrowserActionIcon(extension.extensionId);
        if (icon !== '#') {
          return icon;
        }
        icons = extension.browser_action.default_icon;
      }
      if (manifestIcon) {
        icons = extension.icons;
      }
      if (icons) {
        if (typeof icons === 'string') {
          return this.$electron.remote.nativeImage
            .createFromPath(path.join(extension.srcDirectory, icons)).toDataURL();
        }
        return this.$electron.remote.nativeImage
          .createFromPath(path.join(extension.srcDirectory, Object.values(icons)[0])).toDataURL();
      }
      return undefined;
    } catch (event) {
      return this.$electron.remote.nativeImage
        .createFromPath(path.join(extension.srcDirectory, extension.icons['16'])).toDataURL();
    }
  }
  showOrNot(extension: any): string {
    const isPageAction = extension.page_action;
    if (isPageAction) {
      if (this.pageActionMapping[extension.extensionId]) {
        if (this.pageActionMapping[extension.extensionId].enabled) {
          return 'enabled';
        }
      }
      return 'disabled';
    }
    return 'enabled';
  }
  showPopupOrNot(extension: any): boolean {
    const isPageAction = extension.page_action;
    const isBrowserAction = extension.browser_action;
    if (isPageAction) {
      if (this.pageActionMapping[extension.extensionId]) {
        if (this.pageActionMapping[extension.extensionId].enabled) {
          if (extension.page_action.default_popup) {
            return false;
          }
        }
      }
      return true;
    }
    if (isBrowserAction) {
      if (extension.browser_action.default_popup) {
        return false;
      }
      return true;
    }
    return true;
  }
  showTitle(extension: any): string {
    const isPageAction = extension.page_action;
    const isBrowserAction = extension.browser_action;
    if (isPageAction) {
      return extension.page_action.default_title;
    }
    if (isBrowserAction) {
      return extension.browser_action.default_title;
    }
    return '';
  }
  sendIPC(event: Electron.Event, extension: any): void {
    const currentWindow: Electron.BrowserWindow | null
      = this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const isPageAction = extension.page_action;
      const isBrowserAction = extension.browser_action;
      if (isPageAction || isBrowserAction) {
        const webview: Electron.WebviewTag = this.$refs[`webview-${extension.extensionId}`][0];
        const contextMenuEvent = (event: any) => {
          const { Menu, MenuItem } = this.$electron.remote;
          const menu = new Menu();

          const params: Electron.ContextMenuParams = (event as any).params;

          menu.append(new MenuItem({
            label: this.$t('navbar.extensions.contextMenu.inspectElement') as string,
            click: () => {
              webview.inspectElement(params.x, params.y);
            },
          }));

          menu.popup({ window: currentWindow });
        };
        const ipcMessageEvent = (event: Electron.IpcMessageEvent) => {
          if (event.channel === 'resize') {
            const size = event.args[0];
            webview.style.height = `${size.height}px`;
            webview.style.width = `${size.width}px`;
            webview.style.overflow = 'hidden';
          }
        };
        const domReadyEvent = () => {
          webview.executeJavaScript(`
            function triggerResize() {
              const height = document.body.scrollHeight;
              const width = document.body.scrollWidth;
              ipcRenderer.sendToHost('resize', {
                height,
                width,
              });
            }
            triggerResize();
            new ResizeSensor(document.body, triggerResize);
          `);
        };
        webview.removeEventListener('context-menu', contextMenuEvent);
        webview.addEventListener('context-menu', contextMenuEvent);
        webview.removeEventListener('ipc-message', ipcMessageEvent);
        webview.addEventListener('ipc-message', ipcMessageEvent);
        webview.removeEventListener('dom-ready', domReadyEvent);
        webview.addEventListener('dom-ready', domReadyEvent);
        if (isPageAction) {
          const target: HTMLElement = (event.target as HTMLElement);
          const img: HTMLImageElement = target.tagName === 'SUP'
            ? (target.previousElementSibling! as HTMLImageElement)
            : (target as HTMLImageElement);
          if (img.classList.contains('enabled')) {
            if (isPageAction.default_popup) {
              webview.setAttribute('src', `${url.format({
                protocol: 'lulumi-extension',
                slashes: true,
                hostname: extension.extensionId,
                pathname: isPageAction.default_popup,
              })}`);
              return;
            }
            if (extension.webContentsId) {
              this.$electron.remote.webContents.fromId(extension.webContentsId)
                .send('lulumi-page-action-clicked', { id: this.tab.id });
            }
          }
        } else if (isBrowserAction) {
          if (isBrowserAction.default_popup) {
            webview.setAttribute('src', `${url.format({
              protocol: 'lulumi-extension',
              slashes: true,
              hostname: extension.extensionId,
              pathname: isBrowserAction.default_popup,
            })}`);
            return;
          }
          if (extension.webContentsId) {
            this.$electron.remote.webContents.fromId(extension.webContentsId)
              .send('lulumi-browser-action-clicked', { id: this.tab.id });
          }
        }
      }
    }
  }
  removeLulumiExtension(extensionId: string): void {
    const ipc = this.$electron.ipcRenderer;
    ipc.send('remove-lulumi-extension', extensionId);
  }
  onContextmenu(extension: any): void {
    const currentWindow: Electron.BrowserWindow | null
      = this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const { Menu, MenuItem } = this.$electron.remote;
      const menu = new Menu();

      menu.append(new MenuItem({
        label: extension.name,
        enabled: false,
      }));

      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: this.$t('navbar.extensions.contextMenu.remove') as string,
        click: () => {
          this.removeLulumiExtension(extension.extensionId);
        },
      }));

      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: this.$t('navbar.extensions.contextMenu.manage') as string,
        click: () => {
          (this.$parent as BrowserMainView).onNewTab(this.windowId, 'about:extensions', true);
        },
      }));

      menu.popup({ window: currentWindow });
    }
  }

  mounted() {
    if (!(process.env.NODE_ENV === 'test'
      && process.env.TEST_ENV === 'unit')) {
      // .el-input-group__prepend event(s)
      const prepend = document.getElementsByClassName('el-input-group__prepend')[0];
      prepend.addEventListener('click', this.showCertificate);

      // .el-input__inner event(s)
      const originalInput = document.getElementsByClassName('el-input__inner')[0];
      const newElement = document.createElement('div');
      newElement.id = 'security-indicator';
      (newElement as any).classList = 'el-input__inner';
      newElement.innerHTML = '';
      newElement.style.display = 'none';
      (originalInput.parentElement as any).append(newElement);

      this.clickHandler = () => {
        newElement.style.display = 'none';
        (originalInput as HTMLInputElement).style.display = 'block';
        (this.$refs.input as any).broadcast('ElInput', 'inputSelect');
      };
      this.blurHandler = () => {
        newElement.style.display = 'block';
        (originalInput as HTMLInputElement).style.display = 'none';
      };
    }

    this.showUrl(this.url, this.tab.id);

    const ipc = this.$electron.ipcRenderer;

    ipc.on(
      'lulumi-commands-execute-page-action',
      (event: Electron.IpcMessageEvent, extensionId: string) => {
        const extension = this.$refs[`popover-${extensionId}`][0].referenceElm;
        extension.click();
      });
    ipc.on(
      'lulumi-commands-execute-browser-action',
      (event: Electron.IpcMessageEvent, extensionId: string) => {
        const extension = this.$refs[`popover-${extensionId}`][0].referenceElm;
        extension.click();
      });

    ipc.on('add-lulumi-extension-result', (event: Electron.IpcMessageEvent, data): void => {
      if (data.result === 'OK') {
        (this.$parent as BrowserMainView).extensionService.update();
        ipc.send('lulumi-extension-added', data.name);
      }
    });
    ipc.on('remove-lulumi-extension-result', (event: Electron.IpcMessageEvent, data): void => {
      if (data.result === 'OK') {
        (this.$parent as BrowserMainView).extensionService.update();
      } else {
        alert(data.result);
      }
    });
    ipc.on('remove-lulumi-extension', (event: Electron.IpcMessageEvent, extensionId) => {
      ipc.send('remove-lulumi-extension', extensionId);
    });
    ipc.on('omnibox-ready', (): void => {
      alert(1);
    });
  }
}
</script>

<style lang="less" scoped>
#browser-navbar {
  display: flex;
  height: 35px;
  padding: 0 5px;
  font-size: 15px;
  font-weight: 100;
  background: #f5f5f5;
  border-bottom: 1px solid #aaa;

  a {
    flex: 1;
    padding: 6%;
    border-radius: 3px;
    cursor: default;
    text-decoration: none;
    color: #777;

    &.enabled {
      &:hover {
        background-color: rgb(210, 210, 210);
      }

      &:active {
        background-color: rgb(200, 200, 200);
      }
    }

    &.disabled {
      color: #bbb;
    }
  }

  .control-group {
    display: flex;
    width: 120px;
    align-items: center;
    justify-content: center;
  }

  .input-group {
    flex: 9;
    display: flex;
    margin: 0 5px;

    a {
      border: 1px solid #bbb;
      border-left: 0;
      padding: 4px 0;
      margin: 4px 0 3px;
      flex: 0 0 30px;
      text-align: center;
    }

    #url-input {
      flex: 1;
      display: flex;
    }
  }

  .extensions-group {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: auto;

    * {
      user-select: none;
      -webkit-user-select: none;
    }

    .block {
      padding: 0 3px;
    }

    .badge {
      border-radius: 3px;

      .extension {
        width: 16px;
        padding: 5px;

        &.disabled {
          opacity: 0.3;
        }
      }

      &:hover {
        background-color: rgb(210, 210, 210);
      }

      &:active {
        background-color: rgb(200, 200, 200);
      }
    }
  }

  .common-group {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;

    #browser-navbar__common {
      padding: 2px;
    }
  }
}
</style>
