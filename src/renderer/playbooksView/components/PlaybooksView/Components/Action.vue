<template lang="pug">
el-row.handle
  el-col
    .blockelem.create-flowy
      .blockin
        slot(name="icon")
          i.blockico.el-icon-menu
        .blocktext
          slot(name="title")
            .blocktitle {{ "New visitor" }}
          slot(name="desc")
            .blockdesc {{ "Actions when somebody visits a specified page" }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Col, Row } from 'element-ui';

import '../../../css/flowy.min.css';
import '../../../css/styles.css';

@Component({
  components: {
    'el-col': Col,
    'el-row': Row,
  },
})
export default class Action extends Vue {
}
</script>

<style lang="less" scoped>
.handle {
  z-index: 9999;
}
</style>
