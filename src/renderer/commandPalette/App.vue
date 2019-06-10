<template>
<div id="app">
  <router-view></router-view>
</div>
</template>

<script lang="ts">
export default {
  name: 'command-palette',
};
</script>

<style>

html, body {
  height: 100%;
}

body {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  font-family: Roboto, system-ui, PingFang TC, Heiti TC, sans-serif;
}
</style>
