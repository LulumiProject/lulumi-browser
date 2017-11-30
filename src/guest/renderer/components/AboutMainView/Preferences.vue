<template lang="pug">
  el-row#preferences-menu
    el-col(:span="4")
      el-menu#menu(background-color="#545c64",
                  text-color="#fff",
                  active-text-color="#ffd04b",
                  :router="true")
        div(v-for="(data, index) in datas.preferences", :key="index")
          el-menu-item(:index="`${path}/${data[1]}`") {{ data[0] }}  
    el-col(:span="18", :offset="1")
      router-view
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import { Col, Menu, MenuItem, Row } from 'element-ui';

  @Component({
    components: {
      'el-col': Col,
      'el-menu': Menu,
      'el-menu-item': MenuItem,
      'el-row': Row,
    },
  })
  export default class Preferences extends Vue {
    path: string = '/preferences';

    get datas() {
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
