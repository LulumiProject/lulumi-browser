<template lang="pug">
div(style="width: 100vw; height: 100vh;")
  sidebar#playbooks(ref="sidebar", :sample="sample")
  #canvas
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Col, Row } from 'element-ui';

import Sidebar from './PlaybooksView/Sidebar.vue';

@Component({
  name: 'playbooks-view',
  components: {
    Sidebar,
    'el-col': Col,
    'el-row': Row,
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
}
</script>

<style lang="less">
@font-face {
  font-family: Cascadia;
  src: url('../fonts/Cascadia.ttf') format('truetype');
}

body {
  font-family: Cascadia, 'Source Sans Pro', sans-serif;
  position: absolute;
}

#playbooks {
  width: 320px;
  position: absolute;
  z-index: 9997;
}

#canvas {
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: auto;

  .blockelem {
    z-index: 9998;
  }
}

div.blockelem.dragging {
  z-index: 9999 !important;
}
</style>
