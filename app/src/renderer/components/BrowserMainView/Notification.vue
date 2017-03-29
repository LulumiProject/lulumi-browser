<template lang="pug">
  el-row(:gutter="20", type="flex", align="middle", justify="space-between", style="width: 100vw; flex-direction: row;")
    el-col(:span="18") {{ `${scope} requests ${permission} permission.` }}
    el-col(:span="6")
      el-button(:plain="true", type="success", size="small", @click="onAllow") Allow
      el-button(:plain="true", type="danger", size="small", @click="onDeny") Deny
</template>

<script>
  import { Button, ButtonGroup, Col, Row } from 'element-ui';

  import urlUtil from '../../js/lib/url-util';

  export default {
    data() {
      return {
        permission: null,
        scope: '',
        id: -1,
      };
    },
    components: {
      'el-button': Button,
      'el-button-group': ButtonGroup,
      'el-col': Col,
      'el-row': Row,
    },
    methods: {
      onAllow() {
        const ipc = this.$electron.ipcRenderer;

        ipc.send(`response-permission-${this.id}`, {
          accept: true,
        });
        this.$parent.$refs.webview.style.height = 'calc(100vh - 73px)';
        this.$parent.showNotification = false;
      },
      onDeny() {
        const ipc = this.$electron.ipcRenderer;

        ipc.send(`response-permission-${this.id}`, {
          accept: false,
        });
        this.$parent.$refs.webview.style.height = 'calc(100vh - 73px)';
        this.$parent.showNotification = false;
      },
    },
    mounted() {
      const ipc = this.$electron.ipcRenderer;

      ipc.on('request-permission', (event, data) => {
        if (this.$parent.$refs.webview.getWebContents().id === data.webContentsId) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          this.id = data.webContentsId;
          this.$parent.$refs.webview.style.height = 'calc((100vh - 73px) - 35px)';
          this.$parent.showNotification = true;
          this.permission = data.permission;
          this.scope = urlUtil.getHostname(webContents.getURL());
        }
      });
    },
    beforeDestroy() {
      const ipc = this.$electron.ipcRenderer;
      ipc.removeAllListeners([
        'request-permission',
      ]);
    },
  };
</script>

<style scoped>
</style>
