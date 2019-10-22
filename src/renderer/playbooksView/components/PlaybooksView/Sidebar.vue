<template lang="pug">
el-col(:span="5")
  el-menu(default-active="2")
    el-submenu(index="1")
      template(slot="title")
        i.el-icon-menu
        span {{ text }}
      el-menu-item-group
        template(slot="title") {{ "Group 1" }}
        el-menu-item(index="1-1") {{ "Option 1" }}
    el-menu-item(index="2")
      i.el-icon-location
      span {{ text }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Col, Menu, MenuItem, MenuItemGroup, Submenu } from 'element-ui';

@Component({
  components: {
    'el-col': Col,
    'el-menu': Menu,
    'el-menu-item': MenuItem,
    'el-menu-item-group': MenuItemGroup,
    'el-submenu': Submenu,
  },
})
export default class Sidebar extends Vue {
  get text() {
    return 'test';
  }
}
</script>

<style lang="less" scoped>
</style>
