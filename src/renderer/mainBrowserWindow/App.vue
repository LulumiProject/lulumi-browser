<template lang="pug">
#app
  router-view
</template>

<script>
export default {
  name: 'LulumiBrowser',
};
</script>

<style lang="less">
@import (css) url('https://fonts.googleapis.com/css?family=Source+Code+Pro');

* {
  margin: 0;
  padding: 0;
  box-sizing: initial;
}

html, body {
  height: 100%;
}

body {
  background: radial-gradient(ellipse at center,#f5f5f5 0,hsla(0,0%,90%,.85) 100%);
  background-position: center;
  display: flex;
  font-family: 'Source Code Pro', Courier, monospace;;
  justify-content: center;
  text-align: center;

  &.darwin {
    &:not(.fullscreen) {
      // make room for the traffic lights
      .tabs {
        padding-left: 70px;
      }
    }
  }
}
</style>
