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
    -webkit-user-select: none;
  }
  #nav {
    width: 100vw;
  }
</style>

<template lang="pug">
  div
    #nav
      tabs
      navbar
    page(v-for="(page, i) in pages", :isActive="i == currentPageIndex", :pageIndex="i", :ref="`page-${i}`", :key="`page-${page.pid}`")
</template>

<script>
  import Tabs from './BrowserMainView/Tabs';
  import Navbar from './BrowserMainView/Navbar';
  import Page from './BrowserMainView/Page';

  import urlUtil from '../js/lib/urlutil';

  export default {
    components: {
      Tabs,
      Navbar,
      Page,
    },
    name: 'browser-main',
    computed: {
      pages() {
        return this.$store.getters.pages;
      },
      currentPageIndex() {
        return this.$store.getters.currentPageIndex;
      },
    },
    methods: {
      getWebView(i) {
        i = (typeof i === 'undefined') ? this.$store.getters.currentPageIndex : i;
        return this.$refs[`page-${i}`][0].$refs.webview;
      },
      getPage(i) {
        i = (typeof i === 'undefined') ? this.$store.getters.currentPageIndex : i;
        return this.$refs[`page-${i}`][0];
      },
      getPageObject(i) {
        i = (typeof i === 'undefined') ? this.$store.getters.currentPageIndex : i;
        return this.$store.getters.pages[i];
      },
      // pageHandlers
      onDidStartLoading(event, pageIndex) {
        this.$store.dispatch('didStartLoading', pageIndex);
      },
      onDomReady(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('domReady', {
          pageIndex,
          webview,
        });
      },
      onDidStopLoading(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('didStopLoading', {
          pageIndex,
          webview,
        });
      },
      onPageTitleSet(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('pageTitleSet', {
          pageIndex,
          webview,
        });
      },
      onUpdateTargetUrl(event, pageIndex) {
        this.$store.dispatch('updateTargetUrl', {
          pageIndex,
          url: event.url,
        });
      },
      onMediaStartedPlaying(event, pageIndex) {
        const webview = this.getWebView(pageIndex);
        this.$store.dispatch('mediaStartedPlaying', {
          pageIndex,
          webview,
        });
      },
      onMediaPaused(event, pageIndex) {
        this.$store.dispatch('mediaPaused', pageIndex);
      },
      onToggleAudio(event, pageIndex, muted) {
        this.getWebView(pageIndex).setAudioMuted(muted);
        this.$store.dispatch('toggleAudio', {
          pageIndex,
          muted,
        });
      },
      onPageFaviconUpdated(event, pageIndex) {
        this.$store.dispatch('pageFaviconUpdated', {
          pageIndex,
          url: event.favicons[0],
        });
      },
      onEnterHtmlFullScreen() {
        this.$el.querySelector('#nav').style.height = 0;
        this.getWebView().style.height = '100vh';
      },
      onLeaveHtmlFullScreen() {
        this.$el.querySelector('#nav').style.height = '62px';
        this.getWebView().style.height = 'calc(100vh - 62px)';
      },
      // tabHandlers
      onNewTab() {
        this.$store.dispatch('incrementPid');
        this.$store.dispatch('createTab');
      },
      onTabClick(event, pageIndex) {
        this.$store.dispatch('clickTab', pageIndex);
      },
      onTabClose(event, pageIndex) {
        this.$store.dispatch('closeTab', pageIndex);
      },
      // navHandlers
      onClickHome() {
        this.getPage().navigateTo();
      },
      onClickBack() {
        this.getWebView().goBack();
      },
      onClickForward() {
        this.getWebView().goForward();
      },
      onClickRefresh() {
        this.getWebView().reload();
      },
      onEnterLocation(location) {
        if (urlUtil.isNotURL(location)) {
          const newLocation = `https://www.google.com/search?q=${location}`;
          this.$store.dispatch('updateLocation', newLocation);
          this.getPage().navigateTo(newLocation);
        } else {
          this.getPage().navigateTo(location);
        }
      },
      // onTabContextMenu
      onTabContextMenu(event, pageIndex) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();

        menu.append(new MenuItem({
          label: 'New Tab',
          click: () => {
            this.$store.dispatch('incrementPid');
            this.$store.dispatch('createTab');
          },
        }));
        menu.append(new MenuItem({
          label: 'Duplicate',
          click: () => {
            this.$store.dispatch('incrementPid');
            this.$store.dispatch('createTab', this.pages[pageIndex].location);
          },
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: 'Close Tab',
          click: () => {
            this.$store.dispatch('closeTab', pageIndex);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow());
      },
      // onNavContextMenu
      onNavContextMenu(event) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();
        const el = event.target;
        const clipboard = this.$electron.clipboard;

        menu.append(new MenuItem({
          label: 'Cut',
          role: 'cut',
        }));
        menu.append(new MenuItem({
          label: 'Copy',
          role: 'copy',
        }));
        menu.append(new MenuItem({
          label: 'Paste',
          role: 'paste',
        }));
        menu.append(new MenuItem({
          label: 'Paste and Go',
          click: () => {
            let location = el.value.slice(0, el.selectionStart);
            location += clipboard.readText();
            location += el.value.slice(el.selectionEnd);
            this.$store.dispatch('updateLocation', location);
            this.getPage().navigateTo(location);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow());
      },
      // onWebviewContextMenu
      onWebviewContextMenu(event) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();
        const clipboard = this.$electron.clipboard;

        if (event.params.editFlags.canUndo) {
          menu.append(new MenuItem({
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo',
          }));
        }

        if (event.params.editFlags.canRedo) {
          menu.append(new MenuItem({
            label: 'Redo',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo',
          }));
        }

        menu.append(new MenuItem({ type: 'separator' }));

        if (event.params.editFlags.canCut) {
          menu.append(new MenuItem({
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          }));
        }

        if (event.params.editFlags.canCopy) {
          menu.append(new MenuItem({
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          }));
        }

        if (event.params.editFlags.canPaste) {
          menu.append(new MenuItem({
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste',
          }));
          menu.append(new MenuItem({
            label: 'Paste Without Formatting',
            accelerator: 'Shift+CmdOrCtrl+V',
            role: 'pasteandmatchstyle',
          }));
        }

        menu.append(new MenuItem({
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        }));
        menu.append(new MenuItem({ type: 'separator' }));

        if (event.params.linkURL) {
          menu.append(new MenuItem({
            label: 'Open Link in New Tab',
            click: () => {
              this.$store.dispatch('incrementPid');
              this.$store.dispatch('createTab', event.params.linkURL);
            },
          }));
          menu.append(new MenuItem({
            label: 'Copy Link Address',
            click: () => {
              clipboard.writeText(event.params.linkURL);
            },
          }));
        }

        if (event.params.hasImageContents) {
          menu.append(new MenuItem({
            label: 'Save Image As...',
            click: () => {
              alert('ToDo...');
            },
          }));
          menu.append(new MenuItem({
            label: 'Copy Image URL',
            click: () => {
              clipboard.writeText(event.params.srcURL);
            },
          }));
          menu.append(new MenuItem({
            label: 'Open Image in New Tab',
            click: () => {
              this.$store.dispatch('incrementPid');
              this.$store.dispatch('createTab', event.params.srcURL);
            },
          }));
        }

        menu.append(new MenuItem({ type: 'separator' }));
        const macOS = /^darwin/.test(process.platform);
        if (macOS) {
          if (event.params.selectionText) {
            menu.append(new MenuItem({
              label: `Look up "${event.params.selectionText}"`,
              click: () => {
                this.getWebView().showDefinitionForSelection();
              },
            }));
            menu.append(new MenuItem({ type: 'separator' }));
          }
        }
        menu.append(new MenuItem({
          label: 'Inspect Element',
          click: () => {
            this.getWebView().inspectElement(event.params.x, event.params.y);
          },
        }));

        menu.popup(this.$electron.remote.getCurrentWindow());
      },
    },
    mounted() {
      this.onDidStartLoading.bind(this);
      this.onDomReady.bind(this);
      this.onDidStopLoading.bind(this);
      this.onPageTitleSet.bind(this);
      this.onUpdateTargetUrl.bind(this);
      this.onMediaStartedPlaying.bind(this);
      this.onMediaPaused.bind(this);
      this.onToggleAudio.bind(this);
      this.onPageFaviconUpdated.bind(this);
      this.onNewTab.bind(this);
      this.onTabClick.bind(this);
      this.onTabClose.bind(this);
      this.onTabContextMenu.bind(this);
      this.onWebviewContextMenu.bind(this);
    },
  };
</script>
