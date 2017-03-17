<template lang="pug">
  div
    h1 Homepage
    el-input(
      placeholder="Input homepage you want",
      icon="edit",
      v-model.trim="homepage",
      :autofocus="true",
      ref="input")
    el-button(type="success", @click.prevent="setHomepage") Save
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
        this.$message({
          message: 'Saved successfully.',
          type: 'success',
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
      ipcRenderer.removeAllListeners([		
        'guest-here-your-data',		
      ]);		
    },
  };
</script>
