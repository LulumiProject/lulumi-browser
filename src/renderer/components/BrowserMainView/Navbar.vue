<template lang="pug">
  #browser-navbar(@contextmenu.prevent="onNavbarContextMenu")
    .control-group
      a(@click="$parent.onClickHome", class="enabled")
        iview-icon(type="ios-home", size="16")
      a(id="browser-navbar__goBack", @click="$parent.onClickBack", @contextmenu="$parent.onClickBackContextMenu()", @mousedown="onGoBackMouseDown", @mouseup="onGoBackMouseUp", :class="tab.canGoBack ? 'enabled' : 'disabled'")
        iview-icon(type="arrow-left-c", size="16")
      a(id="browser-navbar__goForward", @click="$parent.onClickForward", @contextmenu="$parent.onClickForwardContextMenu()", @mousedown="onGoForwardMouseDown", @mouseup="onGoForwardMouseUp", :class="tab.canGoForward ? 'enabled' : 'disabled'")
        iview-icon(type="arrow-right-c", size="16")
      a(v-if="tab.isLoading", id="browser-navbar__stop", @click="$parent.onClickStop", class="enabled")
        iview-icon(type="close", size="16")
      a(v-else, @click="$parent.onClickRefresh", id="browser-navbar__refresh", :class="tab.canRefresh ? 'enabled' : 'disabled'")
        iview-icon(type="android-refresh", size="16")
    .input-group
      good-custom-autocomplete#url-input(ref="input",
                                         @keyup.shift.up.native="selectPortion",
                                         @keyup.shift.down.native="selectPortion",
                                         @input="onChange",
                                         @select="onSelect",
                                         :trigger-on-focus="false",
                                         :placeholder="$t('navbar.placeholder')",
                                         :fetch-suggestions="querySearch",
                                         v-focus="focused",
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
                   placement="bottom",
                   trigger="click",
                   :disabled="showPopupOrNot(extension)",
                   :popper-options={
                     gpuAcceleration: true,
                  })
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
          webview.extension(:ref="`webview-${extension.extensionId}`")
    .common-group
      a(id="browser-navbar__common", @click="$parent.onCommonMenu", class="enabled")
        iview-icon(type="android-more-vertical", size="22")
</template>

<script lang="ts">
  import { Component, Watch, Vue } from 'vue-property-decorator';

  import * as path from 'path';
  import * as url from 'url';
  import { focus } from 'vue-focus';

  import AwesomeIcon from 'vue-awesome/components/Icon.vue';
  import 'vue-awesome/icons/angle-double-left';
  import 'vue-awesome/icons/angle-left';
  import 'vue-awesome/icons/angle-right';
  import 'vue-awesome/icons/refresh';
  import 'vue-awesome/icons/times';
  import 'vue-awesome/icons/lock';
  import 'vue-awesome/icons/unlock';

  import * as Fuse from 'fuse.js';
  import Sortable from 'sortablejs';

  import { Badge, Button, Popover } from 'element-ui';
  import IViewIcon from 'iview/src/components/icon';

  import Event from '../../../api/extensions/event';

  import '../../css/el-autocomplete';
  import '../../css/el-badge';
  import '../../css/el-input';
  import urlUtil from '../../js/lib/url-util';
  import urlSuggestion from '../../js/lib/url-suggestion';
  import recommendTopSite from '../../js/data/RecommendTopSite';

  import BrowserMainView from '../BrowserMainView.vue';

  import { navbar, renderer, store } from 'lulumi';

  Vue.component('suggestion-item', {
    functional: true,
    render(h, ctx) {
      const suggestion: renderer.SuggestionObject = ctx.props.item;
      const item: renderer.SuggestionItem = suggestion.item;
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
      focus,
      sortable: {
        update(el) {
          Sortable.create(el, {
            draggable: '.block',
            animation: 150,
          });
        },
      },
    },
    props: [
      'windowId',
    ],
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
    suggestionItems: renderer.SuggestionItem[] = recommendTopSite;
    extensions: any[] = [];
    onbrowserActionClickedEvent: Event = new Event();
    onpageActionClickedEvent: Event = new Event();
    badgeTextArray: navbar.BadgeTextArray = {};
    badgeBackgroundColorArray: navbar.BadgeBackgroundColorArray = {};
    
    windowId: number;

    get dummyTabObject(): store.TabObject {
      return this.$store.getters.tabConfig.dummyTabObject;
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
    get pageActionMapping(): object {
      if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
        return {};
      }
      return this.tabs[this.currentTabIndex].pageActionMapping;
    }
    get certificates(): store.Certificates {
      return this.$store.getters.certificates;
    }
    get url(): string {
      if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
        return '';
      }
      return this.tabs[this.currentTabIndex].url;
    }
    get currentSearchEngine(): store.SearchEngineObject {
      return this.$store.getters.currentSearchEngine;
    }
    get fuse(): Fuse {
      const suggestionItems: renderer.SuggestionItem[] = [];
      this.$store.getters.history.forEach((history) => {
        const part: string = history.url.replace(/(^\w+:|^)\/\//, '');
        suggestionItems.push({
          title: history.title,
          value: part,
          url: part,
          icon: 'document',
        });
      });
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
      return fuse;
    }

    @Watch('url')
    onUrl(newUrl: string): void {
      this.showUrl(this.url, this.tab.id);
      if ((process.env.NODE_ENV !== 'testing') && !this.focused) {
        const currentUrl = url.parse(newUrl, true);
        const originalInput = document.querySelector('.el-input__inner') as HTMLInputElement;
        const newElement = document.getElementById('security-indicator');
        if (newElement !== null) {
          if (currentUrl.href !== undefined && (currentUrl.protocol === 'https:' || currentUrl.protocol === 'wss:')) {
            const hint = this.secure ? 'secure' : 'insecure';
            const newUrl
              = `<div class="security-hint"><span class="${hint}-origin">${currentUrl.protocol}</span>${currentUrl.href.substr(currentUrl.protocol.length)}</div>`;
            originalInput.style.display = 'none';

            newElement.innerHTML = newUrl;
            newElement.style.display = 'block';

            newElement.removeEventListener('click', this.clickHandler, false);
            originalInput.removeEventListener('blur', this.blurHandler, false);
            newElement.addEventListener('click', this.clickHandler);
            originalInput.addEventListener('blur', this.blurHandler);
          } else {
            newElement.style.display = 'none';
            originalInput.style.display = 'block';

            newElement.removeEventListener('click', this.clickHandler, false);
            originalInput.removeEventListener('blur', this.blurHandler, false);
          }
        }
      }
      (this.$refs.input as any).suggestions.length = 0;
    }
    @Watch('focused')
    onFocused(isFocus: boolean): void {
      setTimeout(() => {
        if (!isFocus) {
          (document.querySelector('.my-autocomplete') as HTMLDivElement)
            .style.display = 'none';
        }
      }, 150);
    }

    updateSecure(url: string): void {
      if (urlUtil.getScheme(url) === 'lulumi://') {
        this.secure = true;
        return;
      }
      const hostname = urlUtil.getHostname(url);
      if (hostname) {
        const key
          = Object.keys(this.certificates).find((el) => {
            const rule = new RegExp(`${el}$`);
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
      this.secure = false;
    }
    showCertificate(): void {
      const hostname = urlUtil.getHostname(this.url);
      if (hostname) {
        const certificateObject = this.certificates[hostname];
        if (certificateObject) {
          (this as any).$electron.ipcRenderer.send('show-certificate',
            certificateObject.certificate, `${hostname}\n${certificateObject.verificationResult}`);
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
    unique(suggestions: renderer.SuggestionObject[]): renderer.SuggestionObject[] {
      const newSuggestions: renderer.SuggestionObject[] = [];
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
        if (url === undefined || url.startsWith('lulumi-extension')) {
          this.value = '';
          return;
        }
        if (this.focused) {
          this.value = '';
          return;
        }
        let newUrl = decodeURIComponent(url);
        newUrl = urlUtil.getUrlIfError(newUrl);
        newUrl = urlUtil.getUrlIfPDF(newUrl);
        this.value = urlUtil.getUrlIfAbout(newUrl).url;
      }
    }
    onGoBackMouseDown(): void {
      this.handler = setTimeout(() => (this.$parent as BrowserMainView).onClickBackContextMenu(), 300);
    }
    onGoForwardMouseDown(): void {
      this.handler = setTimeout(() => (this.$parent as BrowserMainView).onClickForwardContextMenu(), 300);
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
    onSelect(event: renderer.SuggestionObject): void {
      const item: renderer.SuggestionItem = event.item;
      this.focused = false;
      if (item.title === `${this.currentSearchEngine.name} ${this.$t('navbar.search')}`) {
        (this.$parent as BrowserMainView).onEnterUrl(
          `${this.currentSearchEngine.search}${encodeURIComponent(item.url)}`);
      } else {
        (this.$parent as BrowserMainView).onEnterUrl(item.url);
      }
    }
    querySearch(queryString: string, cb: Function): void {
      let suggestions: renderer.SuggestionObject[] = [];
      this.suggestionItems.forEach(item => suggestions.push({ item }));
      if (queryString) {
        suggestions = suggestions.filter(this.createFilter(queryString));
      }
      suggestions.push({
        item: {
          title: `${this.currentSearchEngine.name} ${this.$t('navbar.search')}`,
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
      // fuse results
      suggestions = suggestions.concat(this.fuse.search(queryString.toLowerCase()));

      // autocomplete suggestions
      urlSuggestion(this.currentSearchEngine.name,
                    `${this.currentSearchEngine.autocomplete}${this.value}`)
        .then((final) => {
          final.forEach((entry) => {
            suggestions.push({
              item: {
                title: `${this.currentSearchEngine.name} ${this.$t('navbar.search')}`,
                value: entry[0],
                url: entry[0],
                icon: 'search',
              },
            });
          })
          cb(this.unique(suggestions));
        });

    }
    createFilter(queryString: string): (suggestion: any) => boolean {
      return suggestion => (suggestion.item.value.indexOf(queryString.toLowerCase()) === 0);
    }
    setBrowserActionIcon(extensionId: string, path: string): void {
      this.$refs[`popover-${extensionId}`][0].referenceElm.querySelector('img').setAttribute('src', path);
    }
    setBrowserActionBadgeText(extensionId: string, details): void {
      if (this.badgeTextArray[extensionId] === undefined) {
        Vue.set(this.badgeTextArray, extensionId, []);
      }
      const badge = this.badgeTextArray[extensionId];
      if (badge) {
        if (details.tabId) {
          Vue.set(badge,
                  `${require('lulumi').tabs.get(details.tabId).index}`,
                  details.text);
        } else {
          Vue.set(badge, '-1', details.text);
        }
      }
    }
    showBrowserActionBadgeText(extensionId: string): string | number {
      const badge = this.badgeTextArray[extensionId];
      if (badge) {
        if (this.currentTabIndex !== undefined && badge[this.currentTabIndex]) {
          return badge[this.currentTabIndex];
        }
        return badge[-1];
      }
      return '';
    }
    setBrowserActionBadgeBackgroundColor(extensionId: string, details): void {
      if (this.badgeBackgroundColorArray[extensionId] === undefined) {
        Vue.set(this.badgeBackgroundColorArray, extensionId, []);
      }
      const badge = this.badgeBackgroundColorArray[extensionId];
      if (badge) {
        if (details.tabId) {
          Vue.set(badge,
                  `${require('lulumi').tabs.get(details.tabId).index}`,
                  details.color);
        } else {
          Vue.set(badge, '-1', details.color);
        }
      }
    }
    showBrowserActionBadgeBackgroundColor(extensionId: string): string | number {
      const badge = this.badgeBackgroundColorArray[extensionId];
      if (this.$refs[`badge-${extensionId}`] && this.$refs[`badge-${extensionId}`][0]) {
        if (badge) {
          if (this.currentTabIndex !== undefined && badge[this.currentTabIndex]) {
            this.$refs[`badge-${extensionId}`][0].$el.childNodes[1].style.backgroundColor = badge[this.currentTabIndex];
            return badge[this.currentTabIndex];
          }
          this.$refs[`badge-${extensionId}`][0].$el.childNodes[1].style.backgroundColor = badge[-1];
          return badge[-1];
        }
      }
      return '';
    }
    setPageActionIcon(extensionId: string, path: string): void {
      this.$refs[`popover-${extensionId}`][0].referenceElm.querySelector('img').setAttribute('src', path);
    }
    loadIcon(extension: any): string | undefined {
      try {
        const isPageAction = extension.page_action;
        const isBrowserAction = extension.browser_action;
        const manifestIcon = extension.icons;
        let icons = false;
        if (isPageAction) {
          icons = extension.page_action.default_icon;
        }
        if (isBrowserAction) {
          icons = extension.browser_action.default_icon;
        }
        if (manifestIcon) {
          icons = extension.icons;
        }
        if (icons) {
          if (typeof icons === 'string') {
            return (this as any).$electron.remote.nativeImage
              .createFromPath(path.join(extension.srcDirectory, icons)).toDataURL('image/png');
          }
          return (this as any).$electron.remote.nativeImage
            .createFromPath(path.join(extension.srcDirectory, Object.values(icons)[0])).toDataURL('image/png');
        }
        return undefined;
      } catch (event) {
        return (this as any).$electron.remote.nativeImage
          .createFromPath(path.join(extension.srcDirectory, extension.icons['16'])).toDataURL('image/png');
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
      } else if (isBrowserAction) {
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
      } else if (isBrowserAction) {
        return extension.browser_action.default_title;
      }
      return '';
    }
    sendIPC(event: Electron.Event, extension: any): void {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
      const isPageAction = extension.page_action;
      const isBrowserAction = extension.browser_action;
      if (isPageAction || isBrowserAction) {
        const webview = this.$refs[`webview-${extension.extensionId}`][0];
        webview.addEventListener('context-menu', (event) => {
          const { Menu, MenuItem } = (this as any).$electron.remote;
          const menu = new Menu();

          menu.append(new MenuItem({
            label: 'Inspect Element',
            click: () => {
              webview.inspectElement(event.params.x, event.params.y);
            },
          }));

          menu.popup(currentWindow, { async: true });
        });
        webview.addEventListener('ipc-message', (event: Electron.IpcMessageEvent) => {
          if (event.channel === 'resize') {
            const size = event.args[0];
            webview.style.height = `${size.height}px`;
            webview.style.width = `${size.width}px`;
            webview.style.overflow = 'hidden';
          }
        });
        webview.addEventListener('dom-ready', () => {
          webview.executeJavaScript(`
            function triggerResize() {
              const height = document.body.clientHeight;
              const width = document.body.clientWidth;
              ipcRenderer.sendToHost('resize', {
                height,
                width,
              });
            }
            triggerResize();
            new ResizeSensor(document.body, triggerResize);
          `);
        });
        if (isPageAction) {
          const target: HTMLElement = (event.target as HTMLElement);
          const img: HTMLImageElement = target.tagName === 'SUP'
            ? (target.previousElementSibling! as HTMLImageElement)
            : (target as HTMLImageElement);
          if (img.classList.contains('enabled')) {
            if (extension.page_action.default_popup) {
              webview.setAttribute('src', `${url.format({
                protocol: 'lulumi-extension',
                slashes: true,
                hostname: extension.extensionId,
                pathname: extension.page_action.default_popup,
              })}`);
              return;
            }
            if (extension.webContentsId) {
              (this as any).$electron.remote.webContents.fromId(extension.webContentsId)
                .send('lulumi-page-action-clicked', { id: this.tab.id });
            }
          }
        } else if (isBrowserAction) {
          if (extension.browser_action.default_popup) {
            webview.setAttribute('src', `${url.format({
              protocol: 'lulumi-extension',
              slashes: true,
              hostname: extension.extensionId,
              pathname: extension.browser_action.default_popup,
            })}`);
            return;
          }
          if (extension.webContentsId) {
            (this as any).$electron.remote.webContents.fromId(extension.webContentsId)
              .send('lulumi-browser-action-clicked', { id: this.tab.id });
          }
        }
      }
    }
    removeLulumiExtension(extensionId: string): void {
      const ipc = (this as any).$electron.ipcRenderer;
      ipc.send('remove-lulumi-extension', extensionId);
    }
    onContextmenu(extension: any): void {
      const currentWindow: Electron.BrowserWindow
        = (this as any).$electron.remote.BrowserWindow.fromId(this.windowId);
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();

      menu.append(new MenuItem({
        label: 'Remove extension',
        click: () => {
          this.removeLulumiExtension(extension.extensionId);
        },
      }));

      menu.popup(currentWindow, { async: true });
    }

    mounted() {
      if (process.env.NODE_ENV !== 'testing') {
        // .el-input-group__prepend event(s)
        const prepend = document.getElementsByClassName('el-input-group__prepend')[0];
        prepend.addEventListener('click', this.showCertificate);

        // .el-input__inner event(s)
        const originalInput = document.getElementsByClassName('el-input__inner')[0];
        let newElement = document.createElement('div');
        newElement.id = 'security-indicator';
        (newElement as any).classList = 'el-input__inner';
        newElement.innerHTML = '';
        newElement.style.display = 'none';
        (originalInput.parentElement as any).append(newElement);

        originalInput.addEventListener('click', () => {
          this.focused = true;
        });
        originalInput.addEventListener('blur', () => {
          this.focused = false;
        });
        this.clickHandler = () => {
          newElement.style.display = 'none';
          (originalInput as HTMLInputElement).style.display = 'block';
          (originalInput as HTMLInputElement).focus();
        };
        this.blurHandler = () => {
          newElement.style.display = 'block';
          (originalInput as HTMLInputElement).style.display = 'none';
        };
      }

      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;

      ipc.on('lulumi-commands-execute-page-action', (event: Electron.IpcMessageEvent, extensionId: string) => {
        const extension = this.$refs[`popover-${extensionId}`][0].referenceElm;
        extension.click();
      });
      ipc.on('lulumi-commands-execute-browser-action', (event: Electron.IpcMessageEvent, extensionId: string) => {
        const extension = this.$refs[`popover-${extensionId}`][0].referenceElm;
        extension.click();
      });

      ipc.on('add-lulumi-extension-result', (event: Electron.IpcMessageEvent, data): void => {
        if (data.result === 'OK') {
          (this.$parent as BrowserMainView).extensionService.update();
          this.$forceUpdate();
          ipc.send('lulumi-extension-added', data.name);
        }
      });
      ipc.on('remove-lulumi-extension-result', (event: Electron.IpcMessageEvent, data): void => {
        if (data.result === 'OK') {
          (this.$parent as BrowserMainView).extensionService.update();
          this.$forceUpdate();
        } else {
          alert(data.result);
        }
      });

      (this.$parent as BrowserMainView).onRemovedEvent.addListener((tabId) => {
        const tab = require('lulumi').tabs.get(tabId);
        Object.keys(this.badgeTextArray).forEach((k) => {
          const badge = this.badgeTextArray[k];
          if (badge) {
            if (badge[tab.index]) {
              Vue.delete(badge, `${tab.index}`);
            }
          }
        });
        Object.keys(this.badgeBackgroundColorArray).forEach((k) => {
          const badge = this.badgeBackgroundColorArray[k];
          if (badge) {
            if (badge[tab.index]) {
              Vue.delete(badge, `${tab.index}`);
            }
          }
        });
      });
    }
  };
</script>

<style lang="less" scoped>
  #browser-navbar {
    display: flex;
    height: 35px;
    padding: 0 5px;
    font-size: 15px;
    font-weight: 100;
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
      justify-content: center;
      align-items: center;
      width: auto;

      * {
        -webkit-user-select: none;
      }

      .badge {
        .extension {
          width: 16px;
          padding: 5px;
          border-radius: 3px;

          &:hover {
            background-color: rgb(210, 210, 210);
          }

          &:active {
            background-color: rgb(200, 200, 200);
          }

          &.disabled {
            opacity: 0.3;
          }
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
