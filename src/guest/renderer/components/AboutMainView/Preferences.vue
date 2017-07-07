<template lang="pug">
  el-row#preferences-menu
    el-col(:span="4")
      el-menu#menu(theme="dark", class="el-menu-vertical-demo", :router="true")
        div(v-for="(data, index) in datas.preferences", :key="index")
          el-menu-item(:index="`${path}/${data[1]}`") {{ data[0] }}  
    el-col(:span="18", :offset="1")
      router-view
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  @Component
  export default class Preferences extends Vue {
    path: string = '/preferences';

    get datas(): any {
      return this.$store.getters.about;
    }
  };
</script>

<style scoped>
  html {
    background-color: #eee;
  }
  #preferences-menu {
    text-align: center;
  }
  #menu {
    min-height: 100vh;
  }
</style>
