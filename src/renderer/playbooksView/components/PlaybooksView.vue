<template lang="pug">
vue-logics(width="100vw", height="100vh")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  name: 'playbooks-view',
})
export default class PlaybooksView extends Vue {
}
</script>

<style lang="less">
@font-face {
  font-family: Cascadia;
  src: url('../fonts/Cascadia.ttf') format('truetype');
}

body {
  font-family: Cascadia, 'Source Sans Pro', sans-serif;
  position: absolute;
}
</style>
