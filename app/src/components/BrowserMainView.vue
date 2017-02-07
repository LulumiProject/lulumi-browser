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
      navbar(:page="getPageObject()")
    page(v-for="(page, i) in pages", v-show="i == currentPageIndex", :pageIndex="i", :ref="`page-${i}`", :key="`page-${page.pid}`")
</template>

<script>
  import Tabs from './BrowserMainView/Tabs';
  import Navbar from './BrowserMainView/Navbar';
  import Page from './BrowserMainView/Page';

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
        this.getPage().navigateTo(location);
      },
      // onWebviewContextMenu
      onWebviewContextMenu(event) {
        const { Menu, MenuItem } = this.$electron.remote;
        const menu = new Menu();

        if (event.params.linkURL) {
          menu.append(new MenuItem({
            label: 'Open Link in New Tab',
            click: () => {
              this.$store.dispatch('incrementPid');
              this.$store.dispatch('createTab', event.params.linkURL);
            },
          }));
        }

        menu.popup(this.$electron.remote.getCurrentWindow());
      },
    },
    mounted() {
      this.onDidStartLoading.bind(this);
      this.onDomReady.bind(this);
      this.onDidStopLoading.bind(this);
      this.onPageTitleSet.bind(this);
      this.onNewTab.bind(this);
      this.onTabClick.bind(this);
      this.onTabClose.bind(this);
      this.onWebviewContextMenu.bind(this);
    },
  };
</script>
