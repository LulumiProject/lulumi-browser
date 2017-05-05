<template lang="pug">
  #page-wrapper
    h1#about-name(ref="h1") {{ $t('about.aboutPage') }}
    h2#about-desc(ref="h2")
    li(v-for="data in datas.about")
      router-link(:to="`/${data[1]}`", :key="$route.path") {{ data[0] }}
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
    background-color: #eee;
  }
</style>
