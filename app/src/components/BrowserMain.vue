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
    position: fixed;
    margin-top: -30px;
  }
</style>

<template lang="pug">
  div
    #nav
      tabs
      navbar
    page
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
  };
</script>
