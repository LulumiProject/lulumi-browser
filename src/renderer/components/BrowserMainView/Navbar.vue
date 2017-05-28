<template lang="pug">
  #browser-navbar
    .control-group
      a(@click="$parent.onClickHome")
        iview-icon(type="ios-home", size="16")
      a(id="browser-navbar__goBack", @click="$parent.onClickBack", @contextmenu="$parent.onClickBackContextMenu()", @mousedown="onGoBackMouseDown", @mouseup="onGoBackMouseUp", :class="page.canGoBack ? 'enabled' : 'disabled'")
        iview-icon(type="arrow-left-c", size="16")
      a(id="browser-navbar__goForward", @click="$parent.onClickForward", @contextmenu="$parent.onClickForwardContextMenu()", @mousedown="onGoForwardMouseDown", @mouseup="onGoForwardMouseUp", :class="page.canGoForward ? 'enabled' : 'disabled'")
        iview-icon(type="arrow-right-c", size="16")
      a(v-if="page.isLoading", id="browser-navbar__stop", @click="$parent.onClickStop")
        iview-icon(type="close", size="16")
      a(v-else @click="$parent.onClickRefresh", id="browser-navbar__refresh", :class="page.canRefresh ? 'enabled' : 'disabled'")
        iview-icon(type="android-refresh", size="16")
    .input-group(@contextmenu="$parent.onNavContextMenu")
      good-custom-autocomplete#url-input(
        ref="input",
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
          :key="extension",
          style="padding-top: 3px;",)
        el-popover(:ref="`popover-${extension.extensionId}`", placement="bottom", trigger="click", :disabled="showPopupOrNot(extension)")
          img.extension(v-if="(extension !== undefined) && (loadIcon(extension) !== undefined)",
                        :src="loadIcon(extension)",
                        :class="showOrNot(extension)",
                        :title="showTitle(extension)",
                        @click.prevent="sendIPC($event, extension)",
                        @contextmenu.prevent="onContextmenu(extension)",
                        slot="reference")
          webview(:ref="`webview-${extension.extensionId}`")
    el-cascader#dropdown(expand-trigger="hover", :options="options", v-model="selectedOptions", @change="handleChange")
</template>

<script>
  import Vue from 'vue';
  import path from 'path';
  import url from 'url';
  import { focus } from 'vue-focus';

  import AwesomeIcon from 'vue-awesome/components/Icon';
  import 'vue-awesome/icons/angle-double-left';
  import 'vue-awesome/icons/angle-left';
  import 'vue-awesome/icons/angle-right';
  import 'vue-awesome/icons/refresh';
  import 'vue-awesome/icons/times';
  import 'vue-awesome/icons/lock';
  import 'vue-awesome/icons/info-circle';

  import Sortable from 'sortablejs';

  import { Button, Cascader, Popover } from 'element-ui';
  import IViewIcon from 'iview/src/components/icon';

  import Event from '../../../api/extensions/event';

  import '../../css/el-autocomplete';
  import '../../css/el-input';
  import '../../css/el-cascader';
  import urlUtil from '../../js/lib/url-util';
  // import urlSuggestion from '../../js/lib/url-suggestion';
  import recommendTopSite from '../../js/data/RecommendTopSite';

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

  export default {
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
    data() {
      return {
        handler: null,
        clickHandler: null,
        blurHandler: null,
        secure: false,
        focused: false,
        value: '',
        suggestions: recommendTopSite,
        selectedOptions: [],
        options: [
          {
            value: 'preferences',
            label: this.$t('navbar.cascader.options.preferences'),
          },
          {
            value: 'downloads',
            label: this.$t('navbar.cascader.options.downloads'),
          },
          {
            value: 'history',
            label: this.$t('navbar.cascader.options.history'),
          },
          {
            value: 'extensions',
            label: this.$t('navbar.cascader.options.extensions'),
          },
          {
            value: 'help',
            label: this.$t('navbar.cascader.options.help'),
            children: [
              {
                value: 'lulumi',
                label: this.$t('navbar.cascader.options.lulumi'),
              },
            ],
          },
        ],
        extensions: [],
        onbrowserActionClickedEvent: new Event(),
        onpageActionClickedEvent: new Event(),
      };
    },
    components: {
      'awesome-icon': AwesomeIcon,
      'el-button': Button,
      'el-cascader': Cascader,
      'el-popover': Popover,
      'iview-icon': IViewIcon,
    },
    computed: {
      page() {
        if (this.$store.getters.pages.length === 0) {
          return {
            canGoBack: false,
            canGoForward: false,
            canRefresh: false,
            pageActionMapping: {},
          };
        }
        return this.$store.getters.pages[this.$store.getters.currentPageIndex];
      },
      currentPageIndex() {
        return this.$store.getters.currentPageIndex;
      },
      pageActionMapping() {
        if (this.$store.getters.pages.length === 0) {
          return {};
        }
        return this.$store.getters.pages[this.$store.getters.currentPageIndex].pageActionMapping;
      },
      location() {
        if (this.$store.getters.pages.length === 0) {
          return '';
        }
        return this.$store.getters.pages[this.$store.getters.currentPageIndex].location;
      },
      currentSearchEngine() {
        return this.$store.getters.currentSearchEngine;
      },
    },
    watch: {
      location(newLocation) {
        if (process.env.NODE_ENV !== 'testing') {
          const currentLocation = url.parse(newLocation, true);
          const originalInput = document.getElementsByClassName('el-input__inner')[0];
          const newElement = document.getElementById('securityLocation');
          if (currentLocation.protocol === 'https:' || currentLocation.protocol === 'wss:') {
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
        }
      },
    },
    methods: {
      showLocation(location) {
        if (location === undefined || location.startsWith('lulumi-extension')) {
          return '';
        }
        let newLocation = decodeURIComponent(location);
        newLocation = urlUtil.getLocationIfError(newLocation);
        newLocation = urlUtil.getLocationIfPDF(newLocation);
        return urlUtil.getLocationIfAbout(newLocation).url;
      },
      onGoBackMouseDown() {
        this.handler = setTimeout(() => this.$parent.onClickBackContextMenu(), 300);
      },
      onGoForwardMouseDown() {
        this.handler = setTimeout(() => this.$parent.onClickForwardContextMenu(), 300);
      },
      onGoBackMouseUp() {
        if (this.handler) {
          clearTimeout(this.handler);
        }
      },
      onGoForwardMouseUp() {
        if (this.handler) {
          clearTimeout(this.handler);
        }
      },
      onChange(val) {
        this.value = val;
      },
      onSelect(event) {
        if (event.title === `${this.currentSearchEngine.name} ${this.$t('navbar.search')}`) {
          this.$parent.onEnterLocation(
            `${this.currentSearchEngine.search}${encodeURIComponent(event.value)}`);
        } else {
          this.$parent.onEnterLocation(event.value);
        }
      },
      querySearch(queryString, cb) {
        const suggestions = this.suggestions;
        const results =
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
        cb(results);
      },
      createFilter(queryString) {
        return suggestion => (suggestion.value.indexOf(queryString.toLowerCase()) === 0);
      },
      handleChange(val) {
        this.$parent.onNewTab(`about:${val.pop()}`);
      },
      loadIcon(extension) {
        try {
          // eslint-disable-next-line no-prototype-builtins
          const isPageAction = extension.hasOwnProperty('page_action');
          // eslint-disable-next-line no-prototype-builtins
          const isBrowserAction = extension.hasOwnProperty('browser_action');
          if (isPageAction || isBrowserAction) {
            let icons;
            if (isPageAction) {
              icons = extension.page_action.default_icon;
            } else if (isBrowserAction) {
              icons = extension.browser_action.default_icon;
            }
            if (typeof icons === 'string') {
              return this.$electron.remote.nativeImage
                .createFromPath(path.join(extension.srcDirectory, icons)).toDataURL('image/png');
            }
            return this.$electron.remote.nativeImage
              .createFromPath(path.join(extension.srcDirectory, icons['16'])).toDataURL('image/png');
          }
          return undefined;
        } catch (event) {
          return this.$electron.remote.nativeImage
            .createFromPath(path.join(extension.srcDirectory, extension.icons['16'])).toDataURL('image/png');
        }
      },
      showOrNot(extension) {
        // eslint-disable-next-line no-prototype-builtins
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
      },
      showPopupOrNot(extension) {
        // eslint-disable-next-line no-prototype-builtins
        const isPageAction = extension.hasOwnProperty('page_action');
        // eslint-disable-next-line no-prototype-builtins
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
      },
      showTitle(extension) {
        // eslint-disable-next-line no-prototype-builtins
        const isPageAction = extension.hasOwnProperty('page_action');
        // eslint-disable-next-line no-prototype-builtins
        const isBrowserAction = extension.hasOwnProperty('browser_action');
        if (isPageAction) {
          return extension.page_action.default_title;
        } else if (isBrowserAction) {
          return extension.browser_action.default_title;
        }
        return '';
      },
      sendIPC(event, extension) {
        // eslint-disable-next-line no-prototype-builtins
        const isPageAction = extension.hasOwnProperty('page_action');
        // eslint-disable-next-line no-prototype-builtins
        const isBrowserAction = extension.hasOwnProperty('browser_action');
        if (isPageAction || isBrowserAction) {
          const webview = this.$refs[`webview-${extension.extensionId}`][0];
          webview.addEventListener('context-menu', (event) => {
            const { Menu, MenuItem } = this.$electron.remote;
            const menu = new Menu();

            menu.append(new MenuItem({
              label: 'Inspect Element',
              click: () => {
                webview.inspectElement(event.params.x, event.params.y);
              },
            }));

            menu.popup(this.$electron.remote.getCurrentWindow(), { async: true });
          });
          webview.addEventListener('ipc-message', (event) => {
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
            if (event.target.classList.contains('enabled')) {
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
                this.$electron.remote.webContents.fromId(extension.webContentsId)
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
              this.$electron.remote.webContents.fromId(extension.webContentsId)
                .send('lulumi-browser-action-clicked', { id: this.currentPageIndex });
            }
          }
        }
      },
      removeExtension(name) {
        const ipc = this.$electron.ipcRenderer;
        ipc.send('remove-extension', name);
      },
      onContextmenu(extension) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();

        menu.append(new MenuItem({
          label: 'Remove extension',
          click: () => {
            this.removeExtension(extension.name);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow(), { async: true });
      },
    },
    mounted() {
      if (process.env.NODE_ENV !== 'testing') {
        const originalInput = document.getElementsByClassName('el-input__inner')[0];
        const newElement = document.createElement('div');
        newElement.id = 'securityLocation';
        newElement.classList = 'el-input__inner';
        newElement.innerHTML = '';
        newElement.style.display = 'none';
        originalInput.parentElement.append(newElement);

        this.clickHandler = () => {
          newElement.style.display = 'none';
          originalInput.style.display = 'block';
          originalInput.focus();
        };
        this.blurHandler = () => {
          newElement.style.display = 'block';
          originalInput.style.display = 'none';
        };
      }

      const ipc = this.$electron.ipcRenderer;

      ipc.on('lulumi-commands-execute-page-action', (event, extensionId) => {
        const extension = this.$refs[`popover-${extensionId}`][0].referenceElm;
        extension.click();
      });
      ipc.on('lulumi-commands-execute-browser-action', (event, extensionId) => {
        const extension = this.$refs[`popover-${extensionId}`][0].referenceElm;
        extension.click();
      });

      ipc.on('add-extension-result', () => {
        this.$parent.extensionService.update();
        this.$forceUpdate();
      });
      ipc.on('remove-extension-result', (event, result) => {
        if (result === 'OK') {
          this.$parent.extensionService.update();
          this.$forceUpdate();
        } else {
          // eslint-disable-next-line no-alert
          alert(result);
        }
      });
    },
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
      text-decoration: none;
      color: #777;
      cursor: default;

      &:hover {
        text-decoration: none;
        color: blue;
      }

      &:last-child {
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
      }

      &.disabled {
        color: #bbb;
        cursor: default;
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
        border-radius: 2px;

        &:hover {
          background-color: rgb(200, 200, 200);
        }

        &:active {
          background-color: rgb(180, 180, 180);
        }

        &.disabled {
          opacity: 0.3;
        }
      }
    }

    #dropdown {
      width: 0px;
      margin: 5px -5px 2px 30px;
    }
  }
</style>
