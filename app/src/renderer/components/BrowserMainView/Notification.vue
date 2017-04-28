<template lang="pug">
  el-row(:gutter="20", type="flex", align="middle", justify="space-between", style="width: 100vw; flex-direction: row;")
    el-col(:span="18") {{ `${template}` }}
    el-col(:span="6")
      el-button(:plain="true", type="success", size="small", @click="onAllow") {{ $t('notification.permission.request.allow') }}
      el-button(:plain="true", type="danger", size="small", @click="onDeny") {{ $t('notification.permission.request.deny') }}
</template>

<script>
  import { Button, ButtonGroup, Col, Row } from 'element-ui';

  import urlUtil from 'renderer/js/lib/url-util';

  export default {
    data() {
      return {
        type: null,
        template: '',
        permission: null,
        hostname: '',
        id: -1,
        handler: null,
      };
    },
    components: {
      'el-button': Button,
      'el-button-group': ButtonGroup,
      'el-col': Col,
      'el-row': Row,
    },
    computed: {
      permissions() {
        return this.$store.getters.permissions;
      },
    },
    methods: {
      clear() {
        if (this.handler) {
          clearTimeout(this.handler);
        }
      },
      onAllow() {
        const ipc = this.$electron.ipcRenderer;

        if (this.type === 'permission') {
          ipc.send(`response-permission-${this.id}`, {
            accept: true,
          });
          this.$store.dispatch('setPermissions', {
            hostname: this.hostname,
            permission: this.permission,
            accept: true,
          });
        } else {
          ipc.send('quit-and-install', {
            accept: true,
          });
        }
        this.$parent.$refs.webview.style.height = 'calc(100vh - 73px)';
        this.$parent.showNotification = false;

        if (this.handler) {
          clearTimeout(this.handler);
        }
      },
      onDeny() {
        const ipc = this.$electron.ipcRenderer;

        if (this.type === 'permission') {
          ipc.send(`response-permission-${this.id}`, {
            accept: false,
          });
          this.$store.dispatch('setPermissions', {
            hostname: this.hostname,
            permission: this.permission,
            accept: false,
          });
        } else {
          ipc.send('quit-and-install', {
            accept: false,
          });
        }
        this.$parent.$refs.webview.style.height = 'calc(100vh - 73px)';
        this.$parent.showNotification = false;

        if (this.handler) {
          clearTimeout(this.handler);
        }
      },
    },
    mounted() {
      const ipc = this.$electron.ipcRenderer;

      // Every page would add a listenter to the request-permission and
      // update-available event, so ignore the listenters warning.
      ipc.setMaxListeners(0);
      ipc.on('update-available', (event, data) => {
        this.type = 'update';
        this.template = this.$t('notification.update.updateAvailable', { releaseName: data.releaseName });
        this.$parent.$refs.webview.style.height = 'calc((100vh - 73px) - 35px)';
        this.$parent.showNotification = true;
      });
      ipc.on('request-permission', (event, data) => {
        if (this.$parent.$refs.webview.getWebContents().id === data.webContentsId) {
          const webContents = this.$electron.remote.webContents.fromId(data.webContentsId);
          this.id = data.webContentsId;
          this.hostname = urlUtil.getHostname(webContents.getURL());
          this.permission = data.permission;
          if (this.permissions[`${this.hostname}`]) {
            if (this.permissions[`${this.hostname}`][`${this.permission}`] === true) {
              ipc.send(`response-permission-${this.id}`, {
                accept: true,
              });
            } else if (this.permissions[`${this.hostname}`][`${this.permission}`] === false) {
              ipc.send(`response-permission-${this.id}`, {
                accept: false,
              });
            } else {
              this.type = 'permission';
              this.template = this.$t('notification.permission.request.info', { hostname: this.hostname, permission: this.permission });
              this.$parent.$refs.webview.style.height = 'calc((100vh - 73px) - 35px)';
              this.$parent.showNotification = true;
              this.handler = setTimeout(() => {
                ipc.send(`response-permission-${this.id}`, {
                  accept: false,
                });
                this.$parent.$refs.webview.style.height = 'calc(100vh - 73px)';
                this.$parent.showNotification = false;
              }, 5000);
            }
          } else {
            this.type = 'permission';
            this.template = this.$t('notification.permission.request.info', { hostname: this.hostname, permission: this.permission });
            this.$parent.$refs.webview.style.height = 'calc((100vh - 73px) - 35px)';
            this.$parent.showNotification = true;
            this.handler = setTimeout(() => {
              ipc.send(`response-permission-${this.id}`, {
                accept: false,
              });
              this.$parent.$refs.webview.style.height = 'calc(100vh - 73px)';
              this.$parent.showNotification = false;
            }, 5000);
          }
        }
      });
    },
    beforeDestroy() {
      const ipc = this.$electron.ipcRenderer;
      ipc.removeAllListeners([
        'update-available',
      ]);
      ipc.removeAllListeners([
        'request-permission',
      ]);

      this.clear();
    },
  };
</script>

<style scoped>
</style>
