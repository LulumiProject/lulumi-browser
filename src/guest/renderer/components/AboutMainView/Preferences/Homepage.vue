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

<script>
  export default {
    data() {
      return {
        homepage: '',
      };
    },
    methods: {
      setHomepage() {
        // eslint-disable-next-line no-undef
        ipcRenderer.send('set-homepage', {
          homepage: this.homepage,
        });
      },
    },
    mounted() {
      // eslint-disable-next-line no-undef
      ipcRenderer.send('guest-want-data', 'homepage');
      // eslint-disable-next-line no-undef
      ipcRenderer.on('guest-here-your-data', (event, ret) => {
        this.homepage = ret.homepage;
      });
    },
    beforeDestroy() {
      // eslint-disable-next-line no-undef
      ipcRenderer.removeAllListeners('guest-here-your-data');
    },
  };
</script>
