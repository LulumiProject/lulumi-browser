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
  import { Component, Vue } from 'vue-property-decorator';

  declare const ipcRenderer: Electron.IpcRenderer;

  @Component
  export default class Homepage extends Vue {
    homepage: string = '';

    setHomepage(): void {
      ipcRenderer.send('set-homepage', {
        homepage: this.homepage,
      });
    }

    mounted() {
      ipcRenderer.send('guest-want-data', 'homepage');
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.homepage = ret.homepage;
      });
    }
    beforeDestroy() {
      ipcRenderer.removeAllListeners('guest-here-your-data');
    }
  };
</script>
