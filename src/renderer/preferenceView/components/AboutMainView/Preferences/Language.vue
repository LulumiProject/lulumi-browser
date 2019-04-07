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
import { Component, Vue } from 'vue-property-decorator';

import { Option, Select } from 'element-ui';

declare const ipcRenderer: Electron.IpcRenderer;

@Component({
  components: {
    'el-option': Option,
    'el-select': Select,
  },
})
export default class Language extends Vue {
  options: any[] = [
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
  lang: string = '';
  currentLang: string = '';

  setLang(): void {
    if (this.currentLang !== this.lang) {
      ipcRenderer.send('set-lang', {
        label: this.options.find(opt => (opt.value === this.lang)).label,
        lang: this.lang,
      });
    }
  }

  mounted() {
    ipcRenderer.on('guest-here-your-data', (event, ret) => {
      this.lang = ret.lang;
      this.currentLang = ret.lang;
    });
    ipcRenderer.send('guest-want-data', 'lang');
  }
  beforeDestroy() {
    ipcRenderer.removeAllListeners('guest-here-your-data');
  }
}
</script>
