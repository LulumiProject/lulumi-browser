<template lang="pug">
  #page-wrapper
    h1#preferences-name(ref="h1")
    h2#preferences-desc(ref="h2")
</template>

<script>
  import Preferences from './js/preferences';

  export default {
    computed: {
      datas() {
        return this.$store.getters.about.preferences;
      },
    },
    mounted() {
      if (this.datas[0] !== undefined) {
        Preferences(this.$refs, this.datas);
      } else {
        // eslint-disable-next-line no-alert
        alert('Preferences.vue error');
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
