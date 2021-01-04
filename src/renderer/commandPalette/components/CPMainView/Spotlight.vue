<template lang="pug">
div(@keydown.tab="handleClear")
  .overlay
    SearchBar(ref="searchBar")
    hits(ref="hits")
</div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Hits from './Hits.vue';
import SearchBar from './SearchBar.vue';

@Component({
  name: 'spotlight',
  components: {
    Hits,
    SearchBar,
  },
})
export default class Spotlight extends Vue {
  handleClear(): void {
    this.$electron.remote.getGlobal('commandPalette').hide();
  }
}
</script>

<style lang="less" scoped>
.overlay {
  width: 100vw;
  font-size: 12px;
  overflow: hidden;
  border-radius: 6px;
  position: absolute;
  letter-spacing: 0.3px;
  font-family: Verdana, "Lucida Sans Unicode", sans-serif;
  box-shadow: 0 12px 15px 0 rgba(0,0,0,.24), 0 17px 50px 0 rgba(0,0,0,.19);
}
</style>
