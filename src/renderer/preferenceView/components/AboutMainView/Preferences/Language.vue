<template lang="pug">
div
  h1 {{ $t('about.preferencesPage.languagePage.title') }}
  el-select(
    :placeholder="lang",
    v-model.trim="lang",
    @change="setLang",)
    el-option(v-for="item in options", :label="item.label", :value="item.value", :key="item.value")
</template>

<script lang="ts">
/* global Electron, Lulumi */

import { Component, Vue } from 'vue-property-decorator';

import { Option, Select } from 'element-ui';

interface Window extends Lulumi.API.GlobalObject {
  ipcRenderer: Electron.IpcRenderer;
}

declare const window: Window;

@Component({
  components: {
    'el-option': Option,
    'el-select': Select,
  },
})
export default class Language extends Vue {
  options: Array<{ value: string; label: string }> = [
    {
      value: 'en-US',
      label: 'English',
    },
    {
      value: 'zh-CN',
      label: '简体中文',
    },
    {
      value: 'zh-TW',
      label: '正體中文',
    },
  ];
  lang = '';
  currentLang = '';

  setLang(): void {
    if (this.currentLang !== this.lang) {
      window.ipcRenderer.send('set-lang', {
        label: this.options.find(opt => (opt.value === this.lang))!.label,
        lang: this.lang,
      });
    }
  }

  mounted(): void {
    window.ipcRenderer.on('guest-here-your-data', (event, ret) => {
      this.lang = ret.lang;
      this.currentLang = ret.lang;
    });
    window.ipcRenderer.send('guest-want-data', 'lang');
  }
  beforeDestroy(): void {
    window.ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>
