<template lang="pug">
  #page-wrapper
    h1#lulumi-name(ref="h1") About Lulumi
    h2#lulumi-desc(ref="h2")
    li(v-for="data in datas.lulumi")
      span(:key="data[1]") {{ `${data[0]} : ${data[1]}` }}
</template>

<script>
  export default {
    data() {
      return {
        datas: this.$store.getters.about,
      };
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
