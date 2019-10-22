<template lang="pug">
el-row#playbooks(type="flex")
  sidebar
  el-col#panel
    trigger(title="Document Loaded")
    trigger(title="Condition", type="condition", :data="condsSetup")
    trigger(title="Branches", type="panel")
      template(v-slot:content)
        el-row(:gutter="20")
          el-col(:span="12")
            trigger(title="True", type="panel", :content="`Redirecing ${condsSetup[1].label}`")
              template(v-slot:content="{ content }")
                span {{ content }}
          el-col(:span="12")
            trigger(title="False", type="panel")
              template(v-slot:content)
                trigger(title="Document Loaded")
                trigger(title="Condition", type="condition", :data="condsSetup")
                trigger(title="Branches", type="panel")
                  template(v-slot:content)
                    el-row(:gutter="20")
                      el-col(:span="12")
                        trigger(title="True")
                      el-col(:span="12")
                        trigger(title="False")
  el-button#fixed(type="text", icon="el-icon-plus") {{ $t('newStep') }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Button, Card, Col, Row, Table, Tree } from 'element-ui';

import Sidebar from './PlaybooksView/Sidebar.vue';
import Trigger from './PlaybooksView/Components/Trigger.vue';

@Component({
  components: {
    Sidebar,
    Trigger,
    'el-button': Button,
    'el-card': Card,
    'el-col': Col,
    'el-row': Row,
    'el-table': Table,
    'el-tree': Tree,
  },
})
export default class PlaybooksView extends Vue {
  condsSetup = [{
    label: 'Condition 1',
    children: [{
      label: 'document.location === "http://example.com/"',
    }, {
      label: 'document.location === "https://example.com/',
    }],
  }, {
    label: 'Condition 2',
    children: [{
      label: 'document.location === "http://echo.opera.com/"',
    }],
  }];
}
</script>

<style lang="less">
@font-face {
  font-family: Cascadia;
  src: url('../fonts/Cascadia.ttf') format('truetype');
}

body {
  font-family: Cascadia, 'Source Sans Pro', sans-serif;
}

#fixed {
  position: fixed;
  bottom: 0px;
  left: 50%;
}
</style>
