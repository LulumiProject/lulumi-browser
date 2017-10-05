<template lang="pug">
  div
    h1 {{ $t('about.preferencesPage.tabConfigPage.title') }}
    div
      el-input(
        placeholder="Input default opening url you want",
        @change="setTabConfig",
        v-model.trim="defaultUrl",
        :autofocus="true",
        ref="input")
        template(slot="prepend") {{ $t('about.preferencesPage.tabConfigPage.url') }}
    div(style="margin-top: 15px;")
      el-input(
        placeholder="Input default favicon url you want",
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

  import { Input } from 'element-ui';

  import { store } from 'lulumi';

  declare const ipcRenderer: Electron.IpcRenderer;

  @Component({
    components: {
      'el-input': Input,
    },
  })
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
      ipcRenderer.on('guest-here-your-data', (event: Electron.Event, tabConfig: store.TabConfig) => {
        this.defaultUrl = tabConfig.dummyTabObject.url;
        this.defaultFavicon = tabConfig.defaultFavicon;
      });
      ipcRenderer.send('guest-want-data', 'tabConfig');
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
