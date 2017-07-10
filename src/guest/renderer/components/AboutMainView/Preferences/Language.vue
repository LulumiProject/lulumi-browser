<template lang="pug">
  div
    h1 {{ $t('about.preferencesPage.LanguagePage.title') }}
    el-select(
      :placeholder="lang",
      v-model.trim="lang",
      @change="setLang",)
      el-option(v-for="item in options", :label="item.label", :value="item.value", :key="item.value")
</template>

<script>
  export default {
    data() {
      return {
        options: [
          {
            value: 'en',
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
        ],
        lang: '',
        currentLang: '',
      };
    },
    methods: {
      setLang() {
        if (this.currentLang !== this.lang) {
          // eslint-disable-next-line no-undef
          ipcRenderer.send('set-lang', {
            lang: this.lang,
          });
        }
      },
    },
    mounted() {
      // eslint-disable-next-line no-undef
      ipcRenderer.send('guest-want-data', 'lang');
      // eslint-disable-next-line no-undef
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.lang = ret.lang;
        this.currentLang = ret.lang;
      });
    },
    beforeDestroy() {
      // eslint-disable-next-line no-undef
      ipcRenderer.removeAllListeners('guest-here-your-data');
    },
  };
</script>
