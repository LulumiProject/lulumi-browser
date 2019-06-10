<template lang="pug">
  spotlight
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Spotlight from './CPMainView/Spotlight.vue';

@Component({
  name: 'cp-main',
  components: {
    Spotlight,
  },
})
export default class CPMainView extends Vue {
  mounted() {
    const resizeSensor = require('css-element-queries/src/ResizeSensor.js');
    const overlay = this.$el.querySelector('.overlay') as HTMLDivElement;
    new resizeSensor(overlay, () => {
      this.$electron.ipcRenderer.send('alfred-resize', {
        width: overlay.clientWidth,
        height: overlay.clientHeight,
      });
    });
  }
}
</script>
