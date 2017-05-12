<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  import store from 'renderer/vuex/store';

  export default {
    store,
  };
</script>

<style lang="less">
  @import url('https://fonts.googleapis.com/css?family=Source+Code+Pro');

  * {
    margin: 0;
    padding: 0;
    box-sizing: initial;
  }

  html, body {
    height: 100%;
  }

  body {
    background:
      radial-gradient(
        ellipse at center,
        rgba(255, 255, 255, 1) 0%,
        rgba(229, 229, 229, .85) 100%
      );
    background-position: center;
    display: flex;
    font-family: 'Source Code Pro', Courier, monospace;;
    justify-content: center;
    text-align: center;

    &.darwin #chrome-tabs-shell {
      -webkit-app-region: drag;
    }
  }
</style>
