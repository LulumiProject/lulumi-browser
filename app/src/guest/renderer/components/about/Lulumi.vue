<template lang="pug">
  #page-wrapper
    h1#lulumi-name(ref="h1")
    h2#lulumi-desc(ref="h2")
</template>

<script>
  import Lulumi from './js/lulumi';

  export default {
    computed: {
      datas() {
        return this.$store.getters.about.lulumi;
      },
    },
    mounted() {
      if (this.datas[0] !== undefined) {
        Lulumi(this.$refs, this.datas);
      } else {
        // eslint-disable-next-line no-alert
        alert('Lulumi.vue error');
      }
    },
  };
</script>

<style scoped>
  html {
    background-color: #eee
  }
  .dark-mode {
    background-color: rgb(33, 37, 43);
    color: lightgrey
  }
</style>
