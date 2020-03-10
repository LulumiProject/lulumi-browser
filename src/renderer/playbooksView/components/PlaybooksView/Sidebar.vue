<template lang="pug">
div
  el-tabs(type="border-card")
    el-tab-pane
      span(slot="label")
        i.el-icon-menu
        | {{ "Trigger" }}
      trigger
        template(slot="title")
          div.blocktitle {{ "New visitor" }}
      trigger
        template(slot="title")
          div.blocktitle {{ "Action is performed" }}
    el-tab-pane(label="Actions")
  button(@click="output()") {{ "Output" }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Card, Col, Row, Tabs, TabPane } from 'element-ui';

import Flowy from '../../js/flowy';

import Trigger from './Components/Trigger.vue';

@Component({
  props: {
    sample: {
      type: Object,
      required: true,
    },
  },
  components: {
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
  output() {
    if (this.flowy.output) {
      // tslint:disable-next-line
      console.log(JSON.stringify(this.flowy.output()));
    }
  }

  mounted() {
    this.flowy = new Flowy(document.getElementById('canvas') as HTMLDivElement, this.onGrag, this.onRelease, this.onSnap, 40, 40);
  }
}
</script>

<style lang="less">
</style>
