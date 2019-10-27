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

import { cloneDeep } from 'lodash';

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
  sample = {
    metadata: {
      comments: 'This playbook will do redirections.',
      author: 'Boik Su',
    },
    resources: [
      {
        type: 'workflow',
        name: 'Do Redirections',
        properties: {
          state: 'Enabled',
          definitions: {
            triggers: {
              When_the_page_is_loaded: {
                type: 'WebPageEvent',
              },
            },
            actions: {
              Condition: {
                name: 'Condition Test',
                expression: {
                  and: [
                    {
                      equals: [
                        ['document.location', "'http://example.com/'"],
                        ['document.location', "'https://example.com/'"],
                      ],
                    },
                    {
                      equals: [
                        ['document.location', "'http://echo.opera.com/'"],
                      ],
                    },
                  ],
                },
                true: {
                  actions: {
                    Redirect: {
                      uri: 'https://github.com/LulumiProject/lulumi-browser',
                    },
                  },
                },
                false: {},
              },
              Panel: {
                title: 'Panel',
                Panel: {
                  title: 'Panel 2',
                  Panel: {
                    title: 'Panel 3',
                    content: 'End',
                  },
                },
              },
            },
          },
        },
      },
    ],
  };

  show(data) {
    const resource = data.resources[0];
    const definitions = resource.properties.definitions;
    const triggers = definitions.triggers;
    const actions = definitions.actions;

    const triggerCtor = Vue.extend(Trigger);
    const instance = new triggerCtor({
      propsData: {
        title: Object.keys(triggers)[0],
        type: 'panel',
      },
    });

    const h = instance.$createElement;
    const entries = [];
    Object.keys(actions).forEach((action) => {
      if (action === 'Condition') {
        this.createCond(actions[action], h, entries);
      } else if (action === 'Panel') {
        this.createPanel(actions[action], h, entries);
      }
    });

    (instance as any).$scopedSlots = {
      content: () => entries,
    };
    instance.$mount();
    ((this.$refs.panel as Vue).$el as HTMLDivElement).appendChild(instance.$el);
  }
  onClick(command) {
    this.show(this.sample);
    /*
    if (command === 'createPanel') {
      this.sample.resources[0].properties.definitions.actions.Panel = {};
    } else if (command === 'createCond') {
      this.sample.resources[0].properties.definitions.actions.Condition = {};
    }
    */
  }
  createPanel(properties, h, entries) {
    entries.push(
      h(Trigger, {
        props: {
          title: properties.title,
          type: 'panel',
          content: properties.content,
        },
        scopedSlots: (properties.Panel !== undefined) ? {
          content: () => {
            const temp = [];
            this.createPanel(properties.Panel, h, temp);
            return temp;
          },
        }: (properties.content !== undefined) ? {
          content: props => [
            h('span', props.content),
          ],
        }: {},
      }),
    );
  }
  createCond(properties, h, entries) {
    const name = properties.name;
    const expression = properties.expression;
    const template: any = {
      props: {
        title: '',
        type: 'panel',
      },
      attrs: {},
      children: [],
    };

    // initialize conditions
    const conds: any = [];
    expression.and.forEach((exp, index) => {
      const newExp: any = {
        label: `Condition ${index + 1}`,
      };
      if (exp.equals !== undefined) {
        newExp.children = [];
        exp.equals.forEach((equal) => {
          newExp.children.push({
            label: equal.join(' === '),
          });
        });
        conds.push(newExp);
      }
    });

    entries.push(
      h(Trigger, {
        props: {
          title: name,
          type: 'condition',
          data: conds,
        },
      }),
    );

    // true
    const trueBranch = cloneDeep(template);
    trueBranch.props.title = 'True';
    if (properties.true.actions !== undefined) {
      if (properties.true.actions.Redirect) {
        trueBranch.children.push(
          h(Trigger, {
            props: {
              title: 'Redirect',
              type: 'panel',
              content: `Redirecing ${properties.true.actions.Redirect.uri}`,
            },
            scopedSlots: {
              content: props => [
                h('span', props.content),
              ],
            },
          }),
        );
      }
    } else {
      delete trueBranch.props.type;
    }
    // false
    const falseBranch = cloneDeep(template);
    falseBranch.props.title = 'False';
    if (properties.false.actions !== undefined) {
      if (properties.false.actions.Redirect) {
        falseBranch.children.push(
          h(Trigger, {
            props: {
              title: 'Redirect',
              type: 'panel',
              content: `Redirecing ${properties.false.actions.Redirect.uri}`,
            },
            scopedSlots: {
              content: props => [
                h('span', props.content),
              ],
            },
          }),
        );
      }
    } else {
      delete falseBranch.props.type;
    }

    entries.push(
      h(Trigger, {
        props: {
          title: 'Branch',
          type: 'panel',
        },
        scopedSlots: {
          content: () => [
            h('el-row', { attrs: { gutter: 20 } }, [
              h('el-col', { attrs: { span: 12 } }, [
                h(Trigger, {
                  props: trueBranch.props,
                  scopedSlots: {
                    content: () => trueBranch.children,
                  },
                }),
              ]),
              h('el-col', { attrs: { span: 12 } }, [
                h(Trigger, {
                  props: falseBranch.props,
                  scopedSlots: {
                    content: () => falseBranch.children,
                  },
                }),
              ]),
            ]),
          ],
        },
      }),
    );
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
