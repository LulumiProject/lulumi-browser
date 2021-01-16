<template lang="pug">
div
  h1 {{ $t('about.preferencesPage.homePage.title') }}
  el-input(
    placeholder="Input homepage you want",
    @change="setHomepage",
    v-model.trim="homepage",
    :autofocus="true",
    ref="input")
    template(slot="prepend") {{ $t('about.preferencesPage.homePage.homepage') }}
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import { Input } from 'element-ui';

interface Window extends Lulumi.API.GlobalObject {
  ipcRenderer: Electron.IpcRenderer;
}

declare const window: Window;

@Component({
  components: {
    'el-input': Input,
  },
})
export default class Homepage extends Vue {
  homepage = '';

  setHomepage(): void {
    window.ipcRenderer.send('set-homepage', {
      homepage: this.homepage,
    });
  }

  mounted(): void {
    window.ipcRenderer.on('guest-here-your-data', (event, ret) => {
      this.homepage = ret.homepage;
    });
    window.ipcRenderer.send('guest-want-data', 'homepage');
  }
  beforeDestroy(): void {
    window.ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>
