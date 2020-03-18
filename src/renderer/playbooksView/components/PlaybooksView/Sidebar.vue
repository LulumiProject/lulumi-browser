<template lang="pug">
div
  el-tabs(type="border-card")
    el-tab-pane(label="Triggers")
      trigger
        template(slot="icon")
          i.blockico.el-icon-user-solid
        template(slot="title")
          .blocktitle {{ "New visitor" }}
      trigger
        template(slot="icon")
          i.blockico.el-icon-s-promotion
        template(slot="title")
          .blocktitle {{ "Action is performed" }}
    el-tab-pane(label="Actions")
      action
        template(slot="icon")
          i.blockico.el-icon-document-add
        template(slot="title")
          div.blocktitle {{ "Clone the webpage" }}
    el-tab-pane(label="Conditions")
      action
        template(slot="icon")
          i.blockico.el-icon-check
        template(slot="title")
          div.blocktitle {{ "If it's true" }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Card, Col, Row, Tabs, TabPane } from 'element-ui';

import Flowy from '../../js/flowy';

import Action from './Components/Action.vue';
import Condition from './Components/Condition.vue';
import Trigger from './Components/Trigger.vue';

@Component({
  props: {
    sample: {
      type: Object,
      required: true,
    },
  },
  components: {
    Action,
    Condition,
    Trigger,
    'el-card': Card,
    'el-col': Col,
    'el-row': Row,
    'el-tabs': Tabs,
    'el-tab-pane': TabPane,
  },
})
export default class Sidebar extends Vue {
  sample: any;
  flowy: Flowy.Flowy.FlowyElementInterface;

  onGrag() {
    document.querySelectorAll('.handle').forEach((el) => {
      (el as HTMLDivElement).style.zIndex = '9997';
    });
  }
  onRelease() {
    document.querySelectorAll('.handle').forEach((el) => {
      (el as HTMLDivElement).style.zIndex = '9999';
    });
  }
  onSnap(block, first, parent) {
    return true;
  }

  mounted() {
    this.flowy = new Flowy(document.getElementById('canvas') as HTMLDivElement, this.onGrag, this.onRelease, this.onSnap, 40, 40);
  }
}
</script>

<style lang="less">
</style>
