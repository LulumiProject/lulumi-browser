<template lang="pug">
el-row
  el-col
    div(class="is-always-shadow", style="text-align: center;")
      slot(name="header")
        el-card(:class="`el-alert--success is-light`", :body-style="{ padding: '5px' }")
          i.el-alert__icon(:class="`el-icon-success`", style="padding: 0 20px 0 5px;")
          span {{ title }}
      panel(v-if="type === 'panel'", :content="content")
        template(v-slot:[checkType(content)]="{ data }")
          slot(name="content", :content="data")
      condition(v-else-if="type === 'condition'", :data="data")
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Card, Col, Row, Table, Tree } from 'element-ui';

import Panel from './Panel.vue';
import Condition from './Condition.vue';

@Component({
  props: {
    type: {
      type: String,
      required: true,
    },
    title: {
      validator: (value) => {
        return [
          'Document Loaded',
          'Conditions',
        ].indexOf(value) !== -1;
      },
    },
    content: {
      type: String,
    },
    data: {
      type: Object,
    },
  },
  components: {
    Condition,
    Panel,
    'el-card': Card,
    'el-col': Col,
    'el-table': Table,
    'el-tree': Tree,
    'el-row': Row,
  },
})
export default class Trigger extends Vue {
  data: [];

  checkType(content) {
    return (typeof content === 'string') ? 'plain' : 'rich';
  }
}
</script>

<style lang="less" scoped>
</style>
