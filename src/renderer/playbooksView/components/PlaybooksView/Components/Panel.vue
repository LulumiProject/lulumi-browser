<template lang="pug">
el-card(shadow="hover", :body-style="{ padding: '5px' }")
  slot(name="plain", :data="content")
  slot(name="rich", :data="process(content)")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Card } from 'element-ui';

@Component({
  props: {
    content: {
      required: true,
    },
  },
  components: {
    'el-card': Card,
  },
})
export default class Panel extends Vue {
  process(content) {
    return typeof content;
  }
}
</script>

<style lang="less" scoped>
</style>
