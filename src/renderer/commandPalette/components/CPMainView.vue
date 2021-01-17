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
  mounted(): void {
    const ResizeSensor = require('css-element-queries/src/ResizeSensor');
    const overlay = this.$el.querySelector('.overlay') as HTMLDivElement;
    // eslint-disable-next-line no-new
    new ResizeSensor(overlay, () => {
      this.$electron.remote.getGlobal('commandPalette').setBounds({
        width: overlay.clientWidth,
        height: overlay.clientHeight,
      });
    });
  }
}
</script>
