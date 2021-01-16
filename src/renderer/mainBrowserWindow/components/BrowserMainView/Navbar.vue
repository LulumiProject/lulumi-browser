<template lang="pug">
#browser-navbar
  .control-group
    a(@click="$parent.onClickHome", class="enabled")
      iview-icon(type="md-home", size="16")
    a(id="browser-navbar__goBack",
      @click="$parent.onClickBack",
      @contextmenu="$parent.onClickBackContextMenu()",
      @mousedown="onGoBackMouseDown",
      @mouseup="onGoBackMouseUp",
      :class="tab.canGoBack ? 'enabled' : 'disabled'")
      iview-icon(type="md-arrow-round-back", size="16")
    a(id="browser-navbar__goForward",
      @click="$parent.onClickForward",
      @contextmenu="$parent.onClickForwardContextMenu()",
      @mousedown="onGoForwardMouseDown",
      @mouseup="onGoForwardMouseUp",
      :class="tab.canGoForward ? 'enabled' : 'disabled'")
      iview-icon(type="md-arrow-round-forward", size="16")
    a(v-if="tab.isLoading",
      id="browser-navbar__stop",
      @click="$parent.onClickStop",
      class="enabled")
      iview-icon(type="md-close", size="16")
    a(v-else,
      @click="$parent.onClickRefresh",
      id="browser-navbar__refresh",
      :class="tab.canRefresh ? 'enabled' : 'disabled'")
      iview-icon(type="md-refresh", size="16")
  .input-group
    good-custom-autocomplete#url-input.hidden(ref="input",
                                              @compositionstart.native="handleComposition",
                                              @compositionupdate.native="handleComposition",
                                              @compositionend.native="handleComposition",
                                              @contextmenu.native="onNavContextMenu",
                                              @keyup.shift.up.native="selectPortion",
                                              @keyup.shift.down.native="selectPortion",
                                              @keydown.native="detectBackspace",
                                              @focus="onFocus",
                                              @blur="onBlur",
                                              @select="onSelect",
                                              @input="onChange",
                                              :trigger-on-focus="false",
                                              :select-when-unmatched="true",
                                              :placeholder="$t('navbar.placeholder')",
                                              :fetch-suggestions="querySearch",
                                              :value="showUrl",
                                              popper-class="my-autocomplete",
                                              :debounce="0")
      el-button(slot="prepend", @click.native="showCertificate()")
        div.secure(v-if="secure")
          awesome-icon(name="lock")
          span {{ $t('navbar.indicator.secure') }}
        div.insecure(v-else)
          awesome-icon(name="unlock")
          span {{ $t('navbar.indicator.insecure') }}
      #security-indicator(slot="append",
                          class="el-input__inner",
                          v-html="fancyContent",
                          @click="onNewElementParentClick()",
                          @drop="onDrop"
                          @dragenter.self="onDragEnter",
                          @dragleave.self="onDragLeave"
                          @dragover.prevent,
                          @mouseenter.self="onMouseEnter",
                          @mouseleave.self="onMouseLeave")
      template(slot-scope="props")
        component(:is="'SuggestionItem'", :item="props.item")
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
                          allowpopups="")
  .common-group
    a(id="browser-navbar__common", @click="$parent.onCommonMenu", class="enabled")
      iview-icon(type="md-more", size="22")
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Watch, Vue } from 'vue-property-decorator';

import * as path from 'path';
import * as url from 'url';

import AwesomeIcon from 'vue-awesome/components/Icon.vue';
import 'vue-awesome/icons/lock';
import 'vue-awesome/icons/unlock';

import * as Comlink from 'comlink';
import Sortable from 'sortablejs';

import { Badge, Button, Popover } from 'element-ui';
import IViewIcon from 'iview/src/components/icon';

import Event from '../../../api/event';

import urlUtil from '../../../lib/url-util';
import config from '../../constants';

import BrowserMainView from '../BrowserMainView.vue';

/* eslint-disable import/no-unresolved */
import '../../css/el-autocomplete';
import '../../css/el-badge';
import '../../css/el-input';
/* eslint-enable import/no-unresolved */

Vue.component('SuggestionItem', {
  functional: true,
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  render(h, ctx) {
    const suggestion: Lulumi.Renderer.SuggestionObject = ctx.props.item;
    const { item } = suggestion;
    if (item.title) {
      if (suggestion.matches) {
        let renderElementsOfTitle: any = [];
        let renderElementsOfValue: any = [];
        suggestion.matches.forEach((match) => {
          const renderElements: any = [];
          const { key } = match;
          const tmpStr: string = item[key];
          let prefixIndex = 0;
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
          } else if (key === 'value') {
            renderElementsOfValue = renderElements;
          }
        });
        if (renderElementsOfTitle.length === 0) {
          renderElementsOfTitle.push(item.title);
        } else if (renderElementsOfValue.length === 0) {
          renderElementsOfValue.push(item.value);
        }
        if (item.icon.startsWith('http') || item.icon.startsWith('data:')) {
          return h('div', { attrs: { class: 'url' } }, [
            h('object', {
              attrs: {
                data: item.icon,
                type: 'image/x-icon',
                style: 'padding-right: 10px; height: 14px; width: 14px;',
              },
            },
            [
              h('i', {
                attrs: {
                  class:
                    `el-icon-${ctx.parent.$store.getters.tabConfig.lulumiDefault.tabFavicon}`,
                },
              }),
            ]),
            h('span', renderElementsOfValue),
            h('span', { attrs: { class: 'name' } }, [
              ' - ',
              ...renderElementsOfTitle,
            ]),
          ]);
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
  secure = false;
  typing = false;
  focused = false;
  value = '';
  search: any;
  suggestionIndicator = true;
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
  get tabFavicon(): string {
    return this.$store.getters.tabConfig.lulumiDefault.tabFavicon;
  }
  get autoFetch(): boolean {
    return this.$store.getters.autoFetch;
  }
  get pageActionMapping(): any {
    if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
      return {};
    }
    return this.tab.pageActionMapping;
  }
  get certificates(): Lulumi.Store.Certificates {
    return this.$store.getters.certificates;
  }
  get ensureInput(): boolean {
    if (document && this.$refs.input) {
      return true;
    }

    return false;
  }
  get url(): string {
    if (this.tabs.length === 0 || this.currentTabIndex === undefined) {
      this.value = '';
    } else if (this.tab.isLoading && !this.typing) {
      this.value = this.tab.url;
      this.selectText();
    }
    if (this.value === 'lulumi://about/#/newtab') {
      this.value = '';
      this.onNewElementParentClick();
    }
    return this.value;
  }
  get showUrl(): string {
    this.updateSecure(this.url);
    if (urlUtil.canParseURL(this.url)) {
      let newUrl = decodeURIComponent(this.url);
      newUrl = urlUtil.getUrlIfError(newUrl);
      newUrl = urlUtil.getUrlIfPDF(newUrl);
      return (this.typing) ? newUrl : urlUtil.getUrlIfPrivileged(newUrl).omniUrl;
    }
    return this.url;
  }
  get currentSearchEngine(): Lulumi.Store.SearchEngineObject {
    return this.$store.getters.currentSearchEngine;
  }
  get suggestionItemsByHistory(): any {
    const suggestionItems: Lulumi.Renderer.SuggestionItem[] = [];
    const regex = new RegExp(/(^\w+:|^)\/\//);
    this.$store.getters.history.forEach((history) => {
      const part: string = history.url.replace(regex, '');
      suggestionItems.push({
        title: history.title,
        value: part,
        url: part,
        icon: history.favIconUrl,
      });
    });
    return suggestionItems;
  }
  get fancyContent(): string {
    if (this.tab.url === 'chrome://gpu/') {
      return '<div class="security-hint">lulumi://gpu</div>';
    }
    if (this.tab.url === 'lulumi://about/#/newtab') {
      return '<div class="security-hint">lulumi://about/newtab</div>';
    }
    if (this.tab.url.startsWith('lulumi://')) {
      return `<div class="security-hint">${this.showUrl}</div>`;
    }
    const currentUrl = url.parse(this.url, true);
    if (currentUrl.href && currentUrl.protocol) {
      if (currentUrl.protocol === 'https:') {
        const hint = this.secure ? 'secure' : 'insecure';
        return `
          <div class="security-hint">
            <span class="${hint}-origin">${currentUrl.protocol}</span>
            <span>${currentUrl.href.substr(currentUrl.protocol.length)}</span>
          </div>
        `;
      }
      return `
        <div class="security-hint">
          <span>${currentUrl.protocol}</span>
          <span>${currentUrl.href.substr(currentUrl.protocol.length)}</span>
        </div>
      `;
    }
    if (this.url === '') {
      return `
        <div class="security-hint" style="color: #c0c4cc">
          ${this.$t('navbar.placeholder')}
        </div>
      `;
    }
    return `<div class="security-hint">${this.url}</div>`;
  }

  @Watch('tab')
  onTab(newTab: Lulumi.Store.TabObject): void {
    this.value = newTab.url;
  }

  chunk(r: any, j: number): any {
    // eslint-disable-next-line no-confusing-arrow
    return r.reduce((a, b, i, g) => !(i % j) ? a.concat([g.slice(i, i + j)]) : a, []);
  }
  escapePattern(pattern: string): string {
    return pattern.replace(/[\\^$+?.()|[\]{}]/g, '\\$&');
  }
  updateSecure(urlString: string): void {
    if (urlString === '') {
      this.secure = true;
      return;
    }
    const scheme = urlUtil.getScheme(urlString);
    if (scheme === 'lulumi://' || scheme === 'lulumi-extension://' || scheme === 'about:') {
      this.secure = true;
      return;
    }
    if (scheme === 'https://') {
      const hostname = urlUtil.getHostname(urlString);
      if (hostname) {
        const certificateObjectKey =
          Object.keys(this.certificates).find(regex => (
            hostname.match(`^${regex.split('*').map(this.escapePattern).join('.*')}$`) !== null
          ));
        if (certificateObjectKey !== undefined) {
          const certificateObject = this.certificates[certificateObjectKey];
          if (certificateObject) {
            if (certificateObject) {
              this.secure = (certificateObject.verificationResult === 'net::OK');
              return;
            }
          }
        }
      }
    }
    this.secure = false;
  }
  showCertificate(): void {
    const ipc = this.$electron.ipcRenderer;
    const hostname = urlUtil.getHostname(this.value);
    if (hostname) {
      const certificateObjectKey = Object.keys(this.certificates).find(regex => (
        hostname.match(`^${regex.split('*').map(this.escapePattern).join('.*')}$`) !== null
      ));
      if (certificateObjectKey !== undefined) {
        const certificateObject = this.certificates[certificateObjectKey];
        if (certificateObject) {
          ipc.send(
            'show-certificate',
            certificateObject.certificate,
            `${hostname}\n${certificateObject.verificationResult}`
          );
        }
      }
    }
  }
  selectPortion(event: KeyboardEvent): void {
    const { code } = event;
    const el = event.target as HTMLInputElement;
    if (code === 'ArrowUp') {
      el.selectionEnd = el.selectionStart;
      el.selectionStart = 0;
    } else if (code === 'ArrowDown') {
      el.selectionEnd = el.value.length;
    }
  }
  detectBackspace(event: KeyboardEvent): void {
    const { code } = event;
    if (code === 'Backspace') {
      this.suggestionIndicator = false;
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
  onGoBackMouseDown(): void {
    this.handler =
      setTimeout(() => (this.$parent as BrowserMainView).onClickBackContextMenu(), 300);
  }
  onGoForwardMouseDown(): void {
    this.handler =
      setTimeout(() => (this.$parent as BrowserMainView).onClickForwardContextMenu(), 300);
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
  onMouseEnter(event: MouseEvent): void {
    const securityIndicator = event.target as HTMLDivElement;

    if (securityIndicator) {
      securityIndicator.setAttribute(
        'style',
        'border: 2px ridge #ccc; margin: 4px 0 2px -4px; line-height: 20px;'
      );
    }
  }
  onMouseLeave(event: MouseEvent): void {
    const securityIndicator = event.target as HTMLDivElement;

    if (securityIndicator) {
      securityIndicator.setAttribute(
        'style',
        'border: 1px solid #bbb; border-left: 0; margin: 4px 0 2px; line-height: 22px;'
      );
    }
  }
  handleComposition(event: CompositionEvent): void {
    if (event.type === 'compositionend') {
      (this.$refs.input as any).isComposing = false;
    } else {
      (this.$refs.input as any).isComposing = true;
    }
  }
  onNavContextMenu(event: MouseEvent): void {
    this.onNewElementParentClick();
    (this.$parent as BrowserMainView).onNavContextMenu(event);
  }
  onFocus(event: KeyboardEvent): void {
    const input = event.target as HTMLDivElement;

    if (input) {
      input.setAttribute(
        'style',
        'border: 2px ridge #0089ff; margin: 4px 0 2px -2px; line-height: 22px;'
      );
    }
  }
  onBlur(event: KeyboardEvent): void {
    const input = event.target as HTMLDivElement;

    if (input) {
      input.setAttribute(
        'style',
        'border: 1px solid #bbb; margin: 4px 0 2px; line-height: 22px;'
      );
    }

    this.typing = false;
    if (this.ensureInput) {
      const el = ((this.$refs.input as Vue).$el as HTMLInputElement);
      const si = document.getElementById('security-indicator') as HTMLDivElement;
      if (si && si.parentElement) {
        if (!el.querySelector('input')!.classList.contains('hidden')) {
          el.querySelector('input')!.classList.add('hidden');
          si.parentElement.classList.remove('hidden');
          si.querySelector('.security-hint')!.classList.remove('selection');
        }
      }
    }
  }
  onDrop(event: DragEvent): void {
    if (event.dataTransfer) {
      const urlString: string = event.dataTransfer.getData('url');
      if (urlString) {
        this.value = urlString;
        this.onNewElementParentClick();
      }
    }
  }
  onDragEnter(event: any): void {
    if (this.ensureInput) {
      const si = document.getElementById('security-indicator');
      if (event.fromElement &&
        event.toElement &&
        // eslint-disable-next-line max-len
        event.fromElement.className === 'el-input el-input-group el-input-group--append el-input-group--prepend' &&
        event.toElement.className === 'el-input__inner') {
        si!.querySelector('.security-hint')!.classList.add('selection');
      } else if (event.fromElement &&
        event.toElement &&
        event.fromElement.className === 'el-input-group__append' &&
        event.toElement.className === 'el-input__inner') {
        si!.querySelector('.security-hint')!.classList.add('selection');
      }
    }
  }
  onDragLeave(event: any): void {
    if (this.ensureInput) {
      const si = document.getElementById('security-indicator');
      if (event.fromElement &&
        event.toElement &&
        event.fromElement.className === 'el-input-group__append' &&
        event.toElement.className === 'el-input__inner') {
        si!.querySelector('.security-hint')!.classList.remove('selection');
      } else if (event.fromElement &&
        event.toElement &&
        // eslint-disable-next-line max-len
        event.fromElement.className === 'el-input el-input-group el-input-group--append el-input-group--prepend' &&
        event.toElement.className === 'el-input__inner') {
        si!.querySelector('.security-hint')!.classList.remove('selection');
      }
    }
  }
  onSelect(event: Lulumi.Renderer.SuggestionObject): void {
    this.typing = false;
    if (event.item) {
      if (event.item.title === `${this.currentSearchEngine.name} ${this.$t('navbar.search')}`) {
        const { item } = event;
        this.value = this.currentSearchEngine.search.replace(
          '{queryString}',
          encodeURIComponent(item.url)
        );
      } else {
        this.value = event.item.url;
      }
    } else {
      this.value = (event as any).value;
    }
    const el = ((this.$refs.input as Vue).$el as HTMLInputElement);
    if (el) {
      el.querySelector('input')!.setSelectionRange(0, 0);
      (this.$parent as BrowserMainView).onEnterUrl(this.value);
      el.querySelector('input')!.blur();
    }
  }
  onChange(val: string): void {
    this.typing = true;
    this.value = val;
    if (this.value.length === 0) {
      this.suggestionIndicator = true;
    }
  }
  selectText(): void {
    if (this.ensureInput) {
      const el = ((this.$refs.input as Vue).$el as HTMLInputElement);
      el.querySelector('input')!.selectionStart = 0;
      el.querySelector('input')!.selectionEnd = this.value.length;
    }
  }
  onNewElementParentClick(): void {
    if (this.ensureInput) {
      const el = ((this.$refs.input as Vue).$el as HTMLInputElement);
      const si = document.getElementById('security-indicator') as HTMLDivElement;
      if (si && si.parentElement) {
        if (el.querySelector('input')!.classList.contains('hidden')) {
          el.querySelector('input')!.classList.remove('hidden');
          si.parentElement.classList.add('hidden');
          el.querySelector('input')!.focus();
        }
      }
    }
  }
  // eslint-disable-next-line max-len
  async querySearch(queryString: string, cb: (suggestions: Lulumi.Renderer.SuggestionObject[]) => void): Promise<void> {
    const ipc = this.$electron.ipcRenderer;
    const currentSearchEngine: string = this.currentSearchEngine.name;
    const navbarSearch = this.$t('navbar.search');
    let suggestions: Lulumi.Renderer.SuggestionObject[] = [];
    if (this.suggestionIndicator) {
      this.suggestionItems.forEach((item) => {
        item.icon = this.tabFavicon;
        suggestions.push({ item });
      });
    }
    if (queryString) {
      if (queryString.startsWith('about:')) {
        // Privileged Pages
        suggestions.unshift({
          item: {
            title: '',
            value: 'about:about',
            url: 'about:about',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'about:lulumi',
            url: 'about:lulumi',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'about:preferences',
            url: 'about:preferences',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'about:downloads',
            url: 'about:downloads',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'about:history',
            url: 'about:history',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'about:extensions',
            url: 'about:extensions',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'about:playbooks',
            url: 'about:playbooks',
            icon: 'document',
          },
        });
      } else if (queryString.startsWith('lulumi:')) {
        // Privileged Pages
        suggestions.unshift({
          item: {
            title: '',
            value: 'lulumi://about',
            url: 'lulumi://about',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'lulumi://lulumi',
            url: 'lulumi://lulumi',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'lulumi://preferences',
            url: 'lulumi://preferences',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'lulumi://downloads',
            url: 'lulumi://downloads',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'lulumi://history',
            url: 'lulumi://history',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'lulumi://extensions',
            url: 'lulumi://extensions',
            icon: 'document',
          },
        });
        suggestions.unshift({
          item: {
            title: '',
            value: 'lulumi://playbooks',
            url: 'lulumi://playbooks',
            icon: 'document',
          },
        });
      }
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
          icon: this.tabFavicon,
        },
      });
    }

    // calling out fuse results using web workers
    const entries: Lulumi.Renderer.SuggestionObject[][] =
      await Promise.all(this.chunk(this.suggestionItemsByHistory, 10)
        .map(suggestionItem => this.search(suggestionItem, queryString.toLowerCase()))) as any;
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
          // eslint-disable-next-line no-console
          console.error(result.error);
        }
        cb(this.unique(suggestions));
      });
      ipc.send(
        'fetch-search-suggestions',
        this.currentSearchEngine.autocomplete
          .replace('{queryString}', this.value)
          .replace('{language}', this.$store.getters.lang),
        timestamp
      );
    } else {
      cb(this.unique(suggestions));
    }
  }
  createFilter(queryString: string): (suggestion: any) => boolean {
    return suggestion => (suggestion.item.url.indexOf(queryString.toLowerCase()) === 0);
  }
  extensionsMetadata(extensionId: string): Lulumi.Store.ExtensionMetadata | null {
    const { extensionsMetadata } = this.tab;
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
  setBrowserActionBadgeText(extensionId: string, details: any): void {
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
  setBrowserActionBadgeBackgroundColor(extensionId: string, details: any): void {
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
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
    if (currentWindow) {
      const isPageAction = extension.page_action;
      const isBrowserAction = extension.browser_action;
      if (isPageAction || isBrowserAction) {
        const webview: Electron.WebviewTag = this.$refs[`webview-${extension.extensionId}`][0];
        const contextMenuEvent = (event2) => {
          const { Menu, MenuItem } = this.$electron.remote;
          const menu = new Menu();

          const { params } = event2;

          menu.append(new MenuItem({
            label: this.$t('navbar.extensions.contextMenu.inspectElement') as string,
            click: () => {
              webview.inspectElement(params.x, params.y);
            },
          }));

          menu.popup({ window: currentWindow });
        };
        const ipcMessageEvent = (event3: Electron.IpcMessageEvent) => {
          if (event3.channel === 'resize') {
            const size = event3.args[0];
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
    const currentWindow: Electron.BrowserWindow | null =
      this.$electron.remote.BrowserWindow.fromId(this.windowId);
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

  mounted(): void {
    if (this.ensureInput) {
      const el = ((this.$refs.input as Vue).$el as HTMLInputElement);
      const si = document.getElementById('security-indicator') as HTMLDivElement;
      if (si && si.parentElement) {
        if (!el.querySelector('input')!.classList.contains('hidden')) {
          el.querySelector('input')!.classList.add('hidden');
          si.parentElement.classList.remove('hidden');
        }
      }
    }

    this.search = Comlink.wrap(new Worker('search-worker.js'));

    const ipc = this.$electron.ipcRenderer;

    ipc.on(
      'lulumi-commands-execute-page-action',
      (event, extensionId: string) => {
        const extension = this.$refs[`popover-${extensionId}`][0].referenceElm;
        extension.click();
      }
    );
    ipc.on(
      'lulumi-commands-execute-browser-action',
      (event, extensionId: string) => {
        const extension = this.$refs[`popover-${extensionId}`][0].referenceElm;
        extension.click();
      }
    );

    ipc.on('add-lulumi-extension-result', (event, data: any): void => {
      if (data.result === 'OK') {
        (this.$parent as BrowserMainView).extensionService.update();
        ipc.send('lulumi-extension-added', data.name);
      }
    });
    ipc.on('remove-lulumi-extension-result', (event, data: any): void => {
      if (data.result === 'OK') {
        (this.$parent as BrowserMainView).extensionService.update();
      } else {
        // TODO: fix this
      }
    });
    ipc.on('remove-lulumi-extension', (event, extensionId) => {
      ipc.send('remove-lulumi-extension', extensionId);
    });
    ipc.on('omnibox-ready', (): void => {
      // TODO: fix this
    });
  }
}
</script>

<style lang="less" scoped>
#browser-navbar {
  display: flex;
  height: 36px;
  padding: 0 5px;
  font-size: 15px;
  background: #f5f5f5;
  border-top: 1px solid #bbb;
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

    .hidden {
      display: none;
    }

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

      &:hover {
        cursor: text;
      }
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
