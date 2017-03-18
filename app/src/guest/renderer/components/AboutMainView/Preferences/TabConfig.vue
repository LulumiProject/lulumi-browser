<template lang="pug">
  div
    h1 Tab Config
    el-input(
      placeholder="Input default opening location you want",
      @change="setTabConfig",
      v-model.trim="defaultUrl",
      :autofocus="true",
      ref="input")
</template>

<script>
  export default {
    data() {
      return {
        defaultUrl: '',
        defaultFavicon: '',
      };
    },
    methods: {
      setTabConfig() {
        // eslint-disable-next-line no-undef
        ipcRenderer.send('set-tab-config', {
          defaultUrl: this.defaultUrl,
          defaultFavicon: this.defaultFavicon,
        });
      },
    },
    mounted() {
      // eslint-disable-next-line no-undef
      ipcRenderer.send('guest-want-data', 'tabConfig');
      // eslint-disable-next-line no-undef
      ipcRenderer.on('guest-here-your-data', (event, tabConfig) => {
        this.defaultUrl = tabConfig.defaultUrl;
        this.defaultFavicon = tabConfig.defaultFavicon;
      });
    },
    beforeDestroy() {
      // eslint-disable-next-line no-undef
      ipcRenderer.removeAllListeners([
        'guest-here-your-data',
      ]);
    },
  };
</script>
