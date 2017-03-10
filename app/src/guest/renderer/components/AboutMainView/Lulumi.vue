<template lang="pug">
  #page-wrapper
    h1#lulumi-name(ref="h1")
    h2#lulumi-desc(ref="h2")
</template>

<script>
  import Lulumi from '../../js/lulumi';

  export default {
    computed: {
      datas() {
        return this.$store.getters.about;
      },
    },
    mounted() {
      Lulumi(this.$refs, this.datas.lulumi);
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
