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
</style>

<template lang="pug">
  div
    #nav
      tabs(:pages="pages")
      navbar(:page="page")
    page(v-for="(page, i) in pages", :page="page", v-show="i == currentPageIndex", :pageIndex="i", :ref="`page-${i}`", :key="`page-${i}`")
</template>

<script>
  import Tabs from './BrowserMainView/Tabs';
  import Navbar from './BrowserMainView/Navbar';
  import Page from './BrowserMainView/Page';

  export default {
    data() {
      return {
        pages: [this.createPageObject()],
        currentPageIndex: 0,
      };
    },
    components: {
      Tabs,
      Navbar,
      Page,
    },
    name: 'browser-main',
    methods: {
      createPageObject(url) {
        return {
          location: url || 'https://www.github.com/qazbnm456/electron-vue-browser',
          statusText: false,
          title: 'new tab',
          isLoading: false,
          isSearching: false,
          canGoBack: false,
          canGoForward: false,
          canRefresh: false,
        };
      },
      createTab(url) {
        this.createPageObject(url);
      },
      getWebView(i) {
        return this.$refs[`page-${i}`][0].$refs.webview;
      },
      getPageObject() {
        return this.pages[this.currentPageIndex];
      },
      onDidStartLoading(event, page) {
        page.isLoading = true;
        page.title = false;
      },
      onDomReady(event, page, pageIndex) {
        const webview = this.getWebView(pageIndex);
        page.canGoBack = webview.canGoBack();
        page.canGoForward = webview.canGoForward();
        page.canRefresh = true;
      },
      onDidStopLoading(event, page, pageIndex) {
        const webview = this.getWebView(pageIndex);
        page.statusText = false;
        page.location = webview.getURL();
        page.canGoBack = webview.canGoBack();
        page.canGoForward = webview.canGoForward();
        if (!page.title) {
          page.title = page.location;
        }
        page.isLoading = false;
      },
      onPageTitleSet(event) {
        const page = this.getPageObject();
        page.title = event.title;
        page.location = this.getWebView().getURL();
      },
      onNewTab() {
        this.createTab();
      },
      onTabClick(event, pageIndex) {
        this.currentPageIndex = pageIndex;
      },
      onTabClose(event, pageIndex) {
        this.closeTab(pageIndex);
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
    },
  };
</script>
