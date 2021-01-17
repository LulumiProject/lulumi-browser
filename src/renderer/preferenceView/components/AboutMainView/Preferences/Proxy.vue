<template lang="pug">
div
  h1 {{ $t('about.preferencesPage.proxyPage.title') }}
  div
    el-input(
      placeholder="The location of the PAC file",
      @change="setProxy",
      v-model.trim="pacScript",
      :autofocus="true",
      ref="input")
      template(slot="prepend") {{ $t('about.preferencesPage.proxyPage.pacScript') }}
  div(style="margin-top: 15px;")
    el-input(
      placeholder="The rules indicating which proxies to use",
      @change="setProxy",
      v-model.trim="proxyRules",
      :autofocus="true",
      ref="input")
      template(slot="prepend") {{ $t('about.preferencesPage.proxyPage.proxyRules') }}
  div(style="margin-top: 15px;")
    el-input(
      placeholder="The rules indicating which URLs should bypass the proxy settings",
      @change="setProxy",
      v-model.trim="proxyBypassRules",
      :autofocus="true",
      ref="input")
      template(slot="prepend") {{ $t('about.preferencesPage.proxyPage.proxyBypassRules') }}
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
  pacScript = '';
  proxyRules = '';
  proxyBypassRules = '';

  setProxy(): void {
    window.ipcRenderer.send('set-proxy-config', {
      pacScript: this.pacScript,
      proxyRules: this.proxyRules,
      proxyBypassRules: this.proxyBypassRules,
    });
  }

  mounted(): void {
    window.ipcRenderer.on(
      'guest-here-your-data', (event: Electron.Event, proxyConfig: any) => {
        this.pacScript = proxyConfig.pacScript;
        this.proxyRules = proxyConfig.proxyRules;
        this.proxyBypassRules = proxyConfig.proxyBypassRules;
      }
    );
    window.ipcRenderer.send('guest-want-data', 'proxyConfig');
  }
  beforeDestroy(): void {
    window.ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>
