<template lang="pug">
  div
    h1 {{ $t('about.preferencesPage.tabConfigPage.title') }}
    div
      el-input(
        placeholder="Input default opening location you want",
        @change="setTabConfig",
        v-model.trim="defaultUrl",
        :autofocus="true",
        ref="input")
        template(slot="prepend") {{ $t('about.preferencesPage.tabConfigPage.location') }}
    div(style="margin-top: 15px;")
      el-input(
        placeholder="Input default favicon location you want",
        @change="setTabConfig",
        v-model.trim="defaultFavicon",
        :autofocus="true",
        ref="input")
        template(slot="prepend") {{ $t('about.preferencesPage.tabConfigPage.favicon') }}
        template(slot="append")
          img.preview(:src="defaultFavicon", width="24px")
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  declare const ipcRenderer: Electron.IpcRenderer;

  @Component
  export default class TabConfig extends Vue {
    defaultUrl: string = '';
    defaultFavicon: string = '';

    setTabConfig(): void {
      ipcRenderer.send('set-tab-config', {
        defaultUrl: this.defaultUrl,
        defaultFavicon: this.defaultFavicon,
      });
    }

    mounted() {
      ipcRenderer.send('guest-want-data', 'tabConfig');
      ipcRenderer.on('guest-here-your-data', (event, tabConfig) => {
        this.defaultUrl = tabConfig.defaultUrl;
        this.defaultFavicon = tabConfig.defaultFavicon;
      });
    }
    beforeDestroy() {
      ipcRenderer.removeAllListeners('guest-here-your-data');
    }
  };
</script>

<style scoped>
  img.preview {
    display: block;
  }
</style>
