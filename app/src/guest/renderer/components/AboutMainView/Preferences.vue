<template lang="pug">
  #preferences-menu
    el-col(:span="4")
      h5 Preferences Page
      el-menu(theme="dark", class="el-menu-vertical-demo", :router="true")
        div(v-for="(data, index) in datas.preferences", :key="index")
          el-menu-item(:index="`${path}/${data[1]}`") {{ data[0] }}  
    router-view
</template>

<script>
  export default {
    data() {
      return {
        path: '/preferences',
        datas: this.$store.getters.about,
      };
    },
  };
</script>

<style scoped>
  html {
    background-color: #eee;
  }
  #preferences-menu {
    text-align: center;
  }
</style>
