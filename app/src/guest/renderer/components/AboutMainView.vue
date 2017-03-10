<template lang="pug">
  #page-wrapper
    h1#about-name(ref="h1") About Page
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
    mounted() {
      if (window.data) {
        this.$store.dispatch('updateAbout', window.data);
      } else {
        // eslint-disable-next-line no-alert
        alert('error');
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
