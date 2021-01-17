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
      v-model.trim="tabFavicon",
      :autofocus="true",
      ref="input")
      template(slot="prepend") {{ $t('about.preferencesPage.tabConfigPage.favicon') }}
      template(slot="append")
        i.preview(:class="`el-icon-${tabFavicon}`")
  div {{ `&lt;i class="el-icon-${tabFavicon}"&gt;&lt;/i&gt;` }}
    hr
    | Ref:&nbsp;
    a(href="https://element.eleme.io/#/en-US/component/icon", target="_blank")
      | https://element.eleme.io/#/en-US/component/icon
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
export default class TabConfig extends Vue {
  defaultUrl = '';
  tabFavicon = '';

  setTabConfig(): void {
    window.ipcRenderer.send('set-tab-config', {
      defaultUrl: this.defaultUrl,
      tabFavicon: this.tabFavicon,
    });
  }

  mounted(): void {
    window.ipcRenderer.on(
      'guest-here-your-data', (event: Electron.Event, tabConfig: Lulumi.Store.TabConfig) => {
        this.defaultUrl = tabConfig.dummyTabObject.url;
        this.tabFavicon = tabConfig.lulumiDefault.tabFavicon;
      }
    );
    window.ipcRenderer.send('guest-want-data', 'tabConfig');
  }
  beforeDestroy(): void {
    window.ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>

<style scoped>
img.preview {
  display: block;
}
</style>
