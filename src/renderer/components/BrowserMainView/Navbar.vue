<template lang="pug">
  #browser-navbar
    .control-group
      a(@click="$parent.onClickHome", class="enabled")
        iview-icon(type="ios-home", size="16")
      a(id="browser-navbar__goBack", @click="$parent.onClickBack", @contextmenu="$parent.onClickBackContextMenu()", @mousedown="onGoBackMouseDown", @mouseup="onGoBackMouseUp", :class="page.canGoBack ? 'enabled' : 'disabled'")
        iview-icon(type="arrow-left-c", size="16")
      a(id="browser-navbar__goForward", @click="$parent.onClickForward", @contextmenu="$parent.onClickForwardContextMenu()", @mousedown="onGoForwardMouseDown", @mouseup="onGoForwardMouseUp", :class="page.canGoForward ? 'enabled' : 'disabled'")
        iview-icon(type="arrow-right-c", size="16")
      a(v-if="page.isLoading", id="browser-navbar__stop", @click="$parent.onClickStop", class="enabled")
        iview-icon(type="close", size="16")
      a(v-else @click="$parent.onClickRefresh", id="browser-navbar__refresh", :class="page.canRefresh ? 'enabled' : 'disabled'")
        iview-icon(type="android-refresh", size="16")
    .input-group(@contextmenu="$parent.onNavContextMenu")
      good-custom-autocomplete#url-input(
        ref="input",
        @keyup.shift.up.native="selectPortion",
        @keyup.shift.down.native="selectPortion",
        @input="onChange",
        @select="onSelect",
        icon="search",
        :trigger-on-focus="false",
        :placeholder="$t('navbar.placeholder')",
        :fetch-suggestions="querySearch",
        v-focus="focused",
        :value="showLocation(page.location)",
        popper-class="my-autocomplete",
        custom-item="url-suggestion")
        el-button(slot="prepend")
          div.secure(v-if="secure")
            awesome-icon(name="lock")
            span {{ $t('navbar.indicator.secure') }}
          div(v-else)
            awesome-icon(name="info-circle")
            span {{ $t('navbar.indicator.insecure') }}
    .extensions-group(v-sortable="")
      div.block(v-for="extension in extensions",
          :key="extension")
        el-popover(:ref="`popover-${extension.extensionId}`", placement="bottom", trigger="click", :disabled="showPopupOrNot(extension)")
          img.extension(v-if="(extension !== undefined) && (loadIcon(extension) !== undefined)",
                        :src="loadIcon(extension)",
                        :class="showOrNot(extension)",
                        :title="showTitle(extension)",
                        @click.prevent="sendIPC($event, extension)",
                        @contextmenu.prevent="onContextmenu(extension)",
                        slot="reference")
          webview(:ref="`webview-${extension.extensionId}`")
    .common-group
      a(id="browser-navbar__common", @click="$parent.onCommonMenu", class="enabled")
        iview-icon(type="android-more-vertical", size="22")
</template>

<script lang="ts">
  import { Component, Watch, Vue } from 'vue-property-decorator';

  import path from 'path';
  import url from 'url';
  import { focus } from 'vue-focus';

  import AwesomeIcon from 'vue-awesome/components/Icon.vue';
  import 'vue-awesome/icons/angle-double-left';
  import 'vue-awesome/icons/angle-left';
  import 'vue-awesome/icons/angle-right';
  import 'vue-awesome/icons/refresh';
  import 'vue-awesome/icons/times';
  import 'vue-awesome/icons/lock';
  import 'vue-awesome/icons/info-circle';

  import Fuse from 'fuse.js';
  import Sortable from 'sortablejs';

  import { Button, Popover } from 'element-ui';
  import IViewIcon from 'iview/src/components/icon';

  import Event from '../../../api/extensions/event';

  import '../../css/el-autocomplete';
  import '../../css/el-input';
  import urlUtil from '../../js/lib/url-util';
  // import urlSuggestion from '../../js/lib/url-suggestion';
  import recommendTopSite from '../../js/data/RecommendTopSite';

  import BrowserMainView from '../BrowserMainView.vue';

  interface PageObject {
    pid: number;
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
  interface SearchEngineObject {
    name: string;
    search: string;
    autocomplete: string;
  }

  Vue.component('url-suggestion', {
    functional: true,
    render(h, ctx) {
      const item = ctx.props.item;
      if (item.title) {
        return h('li', ctx.data, [
          h('div', { attrs: { class: 'location' } }, [
            h('i', { attrs: { class: `el-icon-${item.icon}`, style: 'padding-right: 10px;' } }),
            item.value,
            h('span', { attrs: { class: 'name' } }, [
              ' - ',
              item.title || '',
            ]),
          ]),
        ]);
      }
      return h('li', ctx.data, [
        h('div', { attrs: { class: 'location' } }, [
          h('i', { attrs: { class: `el-icon-${item.icon}`, style: 'padding-right: 10px;' } }),
          item.value,
        ]),
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
    components: {
      'awesome-icon': AwesomeIcon,
      'el-button': Button,
      'el-popover': Popover,
      'iview-icon': IViewIcon,
    },
  })
  export default class Navbar extends Vue {
    dummyPageObject: PageObject = {
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
    handler: any;
    clickHandler: any;
    blurHandler: any;
    secure: boolean = false;
    focused: boolean = false;
    value: string = '';
    suggestions: object[] = recommendTopSite;
    extensions: any[] = [];
    onbrowserActionClickedEvent: Event = new Event();
    onpageActionClickedEvent: Event = new Event();
    
    get page(): PageObject {
      if (this.$store.getters.pages.length === 0) {
        return this.dummyPageObject;
      }
      return this.$store.getters.pages[this.$store.getters.currentPageIndex];
    }
    get currentPageIndex():number {
      return this.$store.getters.currentPageIndex;
    }
    get pageActionMapping(): object {
      if (this.$store.getters.pages.length === 0) {
        return {};
      }
      return this.$store.getters.pages[this.$store.getters.currentPageIndex].pageActionMapping;
    }
    get location(): string {
      if (this.$store.getters.pages.length === 0) {
        return '';
      }
      return this.$store.getters.pages[this.$store.getters.currentPageIndex].location;
    }
    get currentSearchEngine(): SearchEngineObject {
      return this.$store.getters.currentSearchEngine;
    }
    get fuse(): Fuse {
      const results: object[] = [];
      this.$store.getters.history.forEach((history) => {
        results.push({
          title: history.title,
          value: history.url.replace(/(^\w+:|^)\/\//, ''),
          icon: 'document',
        });
      });
      const fuse = new Fuse(results, {
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

    @Watch('location')
    onLocation(newLocation: string): void {
      if (process.env.NODE_ENV !== 'testing') {
        const currentLocation = url.parse(newLocation, true);
        const originalInput = document.getElementsByClassName('el-input__inner')[0] as HTMLElement;
        const newElement = document.getElementById('securityLocation');
        if (newElement !== null) {
          if (typeof currentLocation.href !== 'undefined' && (currentLocation.protocol === 'https:' || currentLocation.protocol === 'wss:')) {
            this.secure = true;
            const newLocation
              = `<div class="security-location"><span style="color: #3c943c;">${currentLocation.protocol}</span>${currentLocation.href.substr(currentLocation.protocol.length)}</div>`;
            originalInput.style.display = 'none';

            newElement.innerHTML = newLocation;
            newElement.style.display = 'block';

            newElement.removeEventListener('click', this.clickHandler, false);
            originalInput.removeEventListener('blur', this.blurHandler, false);
            newElement.addEventListener('click', this.clickHandler);
            originalInput.addEventListener('blur', this.blurHandler);
          } else {
            this.secure = false;

            newElement.style.display = 'none';
            originalInput.style.display = 'block';

            newElement.removeEventListener('click', this.clickHandler, false);
            originalInput.removeEventListener('blur', this.blurHandler, false);
          }
          (this.$refs.input as any).suggestions = [];
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
    unique(source): object[] {
      const results: object[] = [];
      const seen: Set<string> = new Set();

      source.forEach((s) => {
        if (!seen.has(`${s.icon}:${s.value}`)) {
          seen.add(`${s.icon}:${s.value}`);
          results.push(s);
        }
      });
      return results;
    }
    showLocation(location: string): string {
      if (location === undefined || location.startsWith('lulumi-extension')) {
        return '';
      }
      let newLocation = decodeURIComponent(location);
      newLocation = urlUtil.getLocationIfError(newLocation);
      newLocation = urlUtil.getLocationIfPDF(newLocation);
      return urlUtil.getLocationIfAbout(newLocation).url;
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
    onSelect(event): void {
      if (event.title === `${this.currentSearchEngine.name} ${this.$t('navbar.search')}`) {
        (this.$parent as BrowserMainView).onEnterLocation(
          `${this.currentSearchEngine.search}${encodeURIComponent(event.value)}`);
      } else {
        (this.$parent as BrowserMainView).onEnterLocation(event.value);
      }
    }
    querySearch(queryString: string, cb: Function): void {
      const suggestions = this.suggestions;
      let results =
        queryString ? suggestions.filter(this.createFilter(queryString)) : suggestions;
      results.push({
        title: `${this.currentSearchEngine.name} ${this.$t('navbar.search')}`,
        value: this.value,
        icon: 'search',
      });
      if (results.length === 1 && urlUtil.isURL(this.value)) {
        results.unshift({
          value: this.value,
          icon: 'document',
        });
      }
      /*
      results = urlSuggestion(
        this.currentSearchEngine.name,
        `${this.currentSearchEngine.autocomplete}${this.value}`,
        results);
      setTimeout(() => cb(results), 100);
      */
      // fuse results
      const fuse = this.fuse;
      results = results.concat(fuse.search(queryString.toLowerCase()));
      cb(this.unique(results));
    }
    createFilter(queryString: string): (suggestion: any) => boolean {
      return suggestion => (suggestion.value.indexOf(queryString.toLowerCase()) === 0);
    }
    setBrowserActionIcon(extensionId: string, path: string): void {
      this.$refs[`popover-${extensionId}`][0].referenceElm.setAttribute('src', path);
    }
    setPageActionIcon(extensionId: string, path: string): void {
      this.$refs[`popover-${extensionId}`][0].referenceElm.setAttribute('src', path);
    }
    loadIcon(extension: any): string | undefined {
      try {
        const isPageAction = extension.hasOwnProperty('page_action');
        const isBrowserAction = extension.hasOwnProperty('browser_action');
        const manifestIcon = extension.hasOwnProperty('icons');
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
      const isPageAction = extension.hasOwnProperty('page_action');
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
      const isPageAction = extension.hasOwnProperty('page_action');
      const isBrowserAction = extension.hasOwnProperty('browser_action');
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
      const isPageAction = extension.hasOwnProperty('page_action');
      const isBrowserAction = extension.hasOwnProperty('browser_action');
      if (isPageAction) {
        return extension.page_action.default_title;
      } else if (isBrowserAction) {
        return extension.browser_action.default_title;
      }
      return '';
    }
    sendIPC(event: Electron.Event, extension: any): void {
      const isPageAction = extension.hasOwnProperty('page_action');
      const isBrowserAction = extension.hasOwnProperty('browser_action');
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

          menu.popup((this as any).$electron.remote.getCurrentWindow(), { async: true });
        });
        webview.addEventListener('ipc-message', (event: Electron.IpcMessageEvent) => {
          if (event.channel === 'resize') {
            const size = event.args[0];
            webview.style.height = `calc(${size.height + 30}px)`;
            webview.style.width = `calc(${size.width + 20}px)`;
            webview.style.overflow = 'hidden';
          }
        });
        webview.addEventListener('dom-ready', () => {
          webview.executeJavaScript(`
            var height = document.body.clientHeight;
            var width = document.body.clientWidth;
            ipcRenderer.sendToHost('resize', {
              height,
              width,
            });
          `);
        });
        if (isPageAction) {
          if ((event.target as HTMLElement).classList.contains('enabled')) {
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
                .send('lulumi-page-action-clicked', { id: this.currentPageIndex });
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
              .send('lulumi-browser-action-clicked', { id: this.currentPageIndex });
          }
        }
      }
    }
    removeExtension(name: string): void {
      const ipc = (this as any).$electron.ipcRenderer;
      ipc.send('remove-extension', name);
    }
    onContextmenu(extension: any): void {
      const { Menu, MenuItem } = (this as any).$electron.remote;
      const menu = new Menu();

      menu.append(new MenuItem({
        label: 'Remove extension',
        click: () => {
          this.removeExtension(extension.name);
        },
      }));

      menu.popup((this as any).$electron.remote.getCurrentWindow(), { async: true });
    }

    mounted() {
      if (process.env.NODE_ENV !== 'testing') {
        const originalInput = document.getElementsByClassName('el-input__inner')[0];
        let newElement = document.createElement('div');
        newElement.id = 'securityLocation';
        (newElement as any).classList = 'el-input__inner';
        newElement.innerHTML = '';
        newElement.style.display = 'none';
        (originalInput.parentElement as any).append(newElement);

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

      ipc.on('add-extension-result', () => {
        (this.$parent as BrowserMainView).extensionService.update();
        this.$forceUpdate();
      });
      ipc.on('remove-extension-result', (event: Electron.IpcMessageEvent, result: string) => {
        if (result === 'OK') {
          (this.$parent as BrowserMainView).extensionService.update();
          this.$forceUpdate();
        } else {
          alert(result);
        }
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
      flex: 1;
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
