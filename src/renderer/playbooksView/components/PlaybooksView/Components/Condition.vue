<template lang="pug">
el-tree(:props="{ label: 'label', children: 'children' }",
        :data="data",
        :default-expand-all="true")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Tree } from 'element-ui';

@Component({
  props: {
    data: {
      type: [],
      required: true,
    },
  },
  components: {
    'el-tree': Tree,
  },
})
export default class Condition extends Vue {
  data: [];
}
</script>

<style lang="less" scoped>
</style>
