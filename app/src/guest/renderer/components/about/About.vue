<template lang="pug">
  #page-wrapper
    h1#about-name(ref="h1")
    h2#about-desc(ref="h2")
    li(v-for="data in datas")
      router-link(:to="`/${data[1]}`", :key="$route.path") {{ data[0] }}
</template>

<script>
  import About from './js/about';

  export default {
    computed: {
      datas() {
        return this.$store.getters.about.about;
      },
    },
    mounted() {
      if (this.datas[0] !== undefined) {
        About(this.$refs);
      } else {
        // eslint-disable-next-line no-alert
        alert('About.vue error');
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
