<template lang="pug">
el-row#playbooks(type="flex")
  sidebar
  el-col#panel(ref="panel")
  el-dropdown#fixed(@command="onClick")
    el-button(type="text", icon="el-icon-plus") {{ $t('newStep') }}
    template(v-slot:dropdown)
      el-dropdown-menu
        el-dropdown-item(command="createPanel") {{ "Create a Panel" }}
        el-dropdown-item(command="createCond") {{ "Create a Condition" }}
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Button, Card, Col, Dropdown, DropdownMenu, DropdownItem, Row, Table, Tree } from 'element-ui';

import Sidebar from './PlaybooksView/Sidebar.vue';
import Trigger from './PlaybooksView/Components/Trigger.vue';

@Component({
  components: {
    Sidebar,
    Trigger,
    'el-button': Button,
    'el-card': Card,
    'el-col': Col,
    'el-dropdown': Dropdown,
    'el-dropdown-menu': DropdownMenu,
    'el-dropdown-item': DropdownItem,
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

  onClick(command) {
    if (command === 'createPanel') {
      this.createPanel();
    } else if (command === 'createCond') {
      this.createCond();
    }
  }
  createPanel() {
    const triggerCtor = Vue.extend(Trigger);
    const instance = new triggerCtor({
      propsData: {
        title: 'Click Test',
        type: 'panel',
        content: 'Click Content',
      },
    });
    const h = instance.$createElement;
    (instance as any).$scopedSlots = {
      content: props => [h('span', [
        props.content,
      ])],
    };
    instance.$mount();
    ((this.$refs.panel as Vue).$el as HTMLDivElement).appendChild(instance.$el);
  }
  createCond() {
    const triggerCtor = Vue.extend(Trigger);
    const cond = new triggerCtor({
      propsData: {
        title: 'Condition Test',
        type: 'condition',
        data: this.condsSetup,
      },
    });
    cond.$mount();
    ((this.$refs.panel as Vue).$el as HTMLDivElement).appendChild(cond.$el);

    const branch = new triggerCtor({
      propsData: {
        title: 'Branch Test',
        type: 'panel',
        data: this.condsSetup,
      },
    });
    const h = branch.$createElement;
    branch.$slots.content = [h('el-row', { attrs: { gutter: 20 } }, [
      h('el-col', { attrs: { span: 12 } }, [
        h('trigger', { attrs: { title: 'True', type: 'panel', content: `Redirecing ${this.condsSetup[1].label}` },
          scopedSlots: {
            content: props => [
              h('span', props.content),
            ],
          } }),
      ]),
      h('el-col', { attrs: { span: 12 } }, [
        h('trigger', { attrs: { title: 'False', type: 'panel' },
          scopedSlots: {
            content: () => [
              h('trigger', { attrs: { title: 'Document Loaded' } }),
              // tslint:disable-next-line:max-line-length
              h('trigger', { attrs: { title: 'Condition Test 2', type: 'condition', data: this.condsSetup } }),
              h('trigger', { attrs: { title: 'Branch Test 2', type: 'panel' },
                scopedSlots: {
                  content: () => [
                    h('el-row', { attrs: { gutter: 20 } }, [
                      h('el-col', { attrs: { span: 12 } }, [
                        h('trigger', { attrs: { title: 'True' } }),
                      ]),
                      h('el-col', { attrs: { span: 12 } }, [
                        h('trigger', { attrs: { title: 'False' } }),
                      ]),
                    ]),
                  ],
                } }),
            ],
          } }),
      ]),
    ])];
    branch.$mount();
    ((this.$refs.panel as Vue).$el as HTMLDivElement).appendChild(branch.$el);
  }
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
