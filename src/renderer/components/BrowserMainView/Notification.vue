<template lang="pug">
  el-row(:gutter="20", type="flex", align="middle", justify="space-between", style="width: 100vw; flex-direction: row;")
    el-col(:span="14") {{ `${template}` }}
    el-col(:span="10")
      el-checkbox(v-model="permanent", style="padding-right: 10px;") {{ $t('notification.permission.request.permanent') }}
      el-button(:plain="true", type="success", size="small", @click="onAllow") {{ $t('notification.permission.request.allow') }}
      el-button(:plain="true", type="danger", size="small", @click="onDeny") {{ $t('notification.permission.request.deny') }}
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import VueI18n from 'vue-i18n';

  import { Button, ButtonGroup, Checkbox, Col, Row } from 'element-ui';

  import urlUtil from '../../js/lib/url-util';

  import Tab from './Tab.vue';

  @Component({
    components: {
      'el-button': Button,
      'el-button-group': ButtonGroup,
      'el-checkbox': Checkbox,
      'el-col': Col,
      'el-row': Row,
    },
  })
  export default class Notification extends Vue {
    permanent: boolean = false;
    type: string = '';
    template: VueI18n.LocaleMessage = '';
    permission: string = ''; 
    hostname: string | null;
    id: number = -1;
    handler: any;
    
    get permissions() {
      return this.$store.getters.permissions;
    }

    clear() {
      if (this.handler) {
        clearTimeout(this.handler);
      }
    }
    onAllow() {
      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;

      if (this.type === 'permission') {
        ipc.send(`response-permission-${this.id}`, {
          accept: true,
        });
        if (this.permanent) {
          this.$store.dispatch('setPermissions', {
            hostname: this.hostname,
            permission: this.permission,
            accept: true,
          });
        }
      } else {
        ipc.send('quit-and-install', {
          accept: true,
        });
      }
      (this.$parent.$refs.webview as Electron.WebviewTag).style.height = 'calc(100vh - 73px)';
      (this.$parent as Tab).showNotification = false;

      if (this.handler) {
        clearTimeout(this.handler);
      }
    }
    onDeny() {
      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;

      if (this.type === 'permission') {
        ipc.send(`response-permission-${this.id}`, {
          accept: false,
        });
        if (this.permanent) {
          this.$store.dispatch('setPermissions', {
            hostname: this.hostname,
            permission: this.permission,
            accept: false,
          });
        }
      } else {
        ipc.send('quit-and-install', {
          accept: false,
        });
      }
      (this.$parent.$refs.webview as Electron.WebviewTag).style.height = 'calc(100vh - 73px)';
      (this.$parent as Tab).showNotification = false;

      if (this.handler) {
        clearTimeout(this.handler);
      }
    }

    mounted() {
      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;

      // Every page would add a listenter to the request-permission and
      // update-available event, so ignore the listenters warning.
      ipc.setMaxListeners(0);
      ipc.on('update-available', (event, data) => {
        this.type = 'update';
        this.template = this.$t('notification.update.updateAvailable', { releaseName: data.releaseName });
        (this.$parent.$refs.webview as Electron.WebviewTag).style.height = 'calc((100vh - 73px) - 35px)';
        (this.$parent as Tab).showNotification = true;
      });
      ipc.on('request-permission', (event, data) => {
        if ((this.$parent.$refs.webview as Electron.WebviewTag).getWebContents().id === data.webContentsId) {
          const webContents = (this as any).$electron.remote.webContents.fromId(data.webContentsId);
          const webview = this.$parent.$refs.webview as Electron.WebviewTag;
          this.id = data.webContentsId;
          this.hostname = urlUtil.getHostname(webContents.getURL());
          this.permission = data.permission;
          if (this.hostname !== null) {
            if (this.permission === 'setLanguage') {
              this.type = 'permission';
              this.template = this.$t('notification.permission.request.setLanguage', { hostname: webContents.getURL(), lang: data.lang });
              webview.style.height = 'calc((100vh - 73px) - 35px)';
              (this.$parent as Tab).showNotification = true;
              this.handler = setTimeout(() => {
                ipc.send(`response-permission-${this.id}`, {
                  accept: false,
                });
                webview.style.height = 'calc(100vh - 73px)';
                (this.$parent as Tab).showNotification = false;
              }, 10000);
            } else {
              if (this.permissions[`${this.hostname}`]
                && this.permissions[`${this.hostname}`].hasOwnProperty(`${this.permission}`)) {
                ipc.send(`response-permission-${this.id}`, {
                  accept: this.permissions[`${this.hostname}`][`${this.permission}`],
                });
              } else {
                this.type = 'permission';
                this.template = this.$t('notification.permission.request.normal', { hostname: this.hostname, permission: this.permission });
                webview.style.height = 'calc((100vh - 73px) - 35px)';
                (this.$parent as Tab).showNotification = true;
                this.handler = setTimeout(() => {
                  ipc.send(`response-permission-${this.id}`, {
                    accept: false,
                  });
                  webview.style.height = 'calc(100vh - 73px)';
                  (this.$parent as Tab).showNotification = false;
                }, 5000);
              }
            }
          }
        }
      });
    }
    beforeDestroy() {
      const ipc: Electron.IpcRenderer = (this as any).$electron.ipcRenderer;
      ipc.removeAllListeners('update-available');
      ipc.removeAllListeners('request-permission');

      this.clear();
    }
  };
</script>

<style scoped>
</style>
