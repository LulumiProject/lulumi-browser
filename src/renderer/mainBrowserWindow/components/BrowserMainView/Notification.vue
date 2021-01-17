<template lang="pug">
el-row(:gutter="20",
       type="flex",
       align="middle",
       justify="space-between",
       style="width: 100vw; flex-direction: row;")
  el-col(:span="14") {{ `${template}` }}
  el-col(:span="10")
    el-checkbox(v-show="visible",
                v-model="permanent",
                style="padding-right: 10px;")
      | {{ $t('notification.permission.request.permanent') }}
    el-button(:plain="true",
              type="success",
              size="small",
              @click="onAllow")
      | {{ $t('notification.permission.request.allow') }}
    el-button(:plain="true",
              type="danger",
              size="small",
              @click="onDeny")
      | {{ $t('notification.permission.request.deny') }}
</template>

<script lang="ts">
/* global Electron */

import { Component, Vue } from 'vue-property-decorator';

import { Button, ButtonGroup, Checkbox, Col, Row } from 'element-ui';

import urlUtil from '../../../lib/url-util';

import BrowserMainView from '../BrowserMainView.vue';

@Component({
  props: {
    windowWebContentsId: {
      type: Number,
      required: true,
    },
    tabId: {
      type: Number,
      required: true,
    },
  },
  components: {
    'el-button': Button,
    'el-button-group': ButtonGroup,
    'el-checkbox': Checkbox,
    'el-col': Col,
    'el-row': Row,
  },
})
export default class Notification extends Vue {
  windowWebContentsId: number;

  visible = true;
  permanent = false;
  type = '';
  template = '';
  permission = '';
  hostname: string | null;
  id = -1;
  handler: any;

  get permissions(): any {
    return this.$store.getters.permissions;
  }

  clear(): void {
    if (this.handler) {
      clearTimeout(this.handler);
    }
  }
  onAllow(): void {
    const ipc = this.$electron.ipcRenderer;

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
    const browserView = (this.$parent as BrowserMainView).getBrowserView();
    const bounds = browserView.getBounds();
    bounds.height -= (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
    bounds.y += (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
    browserView.setBounds(bounds);
    (this.$parent as BrowserMainView).showNotification = false;
    this.id = -1;

    if (this.handler) {
      clearTimeout(this.handler);
    }
  }
  onDeny(): void {
    const ipc = this.$electron.ipcRenderer;

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
    const browserView = (this.$parent as BrowserMainView).getBrowserView();
    const bounds = browserView.getBounds();
    bounds.height -= (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
    bounds.y += (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
    browserView.setBounds(bounds);
    (this.$parent as BrowserMainView).showNotification = false;
    this.id = -1;

    if (this.handler) {
      clearTimeout(this.handler);
    }
  }

  mounted(): void {
    const ipc = this.$electron.ipcRenderer;

    // Every page would add a listenter to the request-permission and
    // update-available event, so ignore the listenters warning.
    ipc.setMaxListeners(0);
    ipc.on('update-available', (event, data) => {
      this.type = 'update';
      this.template =
        this.$t(
          'notification.update.updateAvailable',
          { releaseName: data.releaseName }
        ) as string;
      const browserView = (this.$parent as BrowserMainView).getBrowserView();
      const bounds = browserView.getBounds();
      bounds.height -= (this.$parent as BrowserMainView).getNavAndStatusBarHeight() - 36;
      bounds.y += (this.$parent as BrowserMainView).getNavAndStatusBarHeight() + 36;
      browserView.setBounds(bounds);
      (this.$parent as BrowserMainView).showNotification = true;
    });
    ipc.on('request-permission', (event, data) => {
      const webContents: Electron.webContents | null =
        this.$electron.remote.webContents.fromId(data.webContentsId);
      if (webContents && webContents.hostWebContents.id === this.windowWebContentsId) {
        if ((this.$parent as BrowserMainView).getBrowserView()
          .webContents.id === data.webContentsId) {
          const browserView = (this.$parent as BrowserMainView).getBrowserView();
          this.id = data.webContentsId;
          this.hostname = urlUtil.getHostname(webContents.getURL());
          this.permission = data.permission;
          if (this.hostname !== null) {
            if (this.permission === 'setLanguage') {
              this.visible = false;
              this.hostname = webContents.getURL();
              this.type = 'permission';
              this.template = this.$t(
                'notification.permission.request.setLanguage',
                { hostname: this.hostname, lang: data.label }
              ) as string;
              const bounds = browserView.getBounds();
              bounds.height -= (this.$parent as BrowserMainView).getNavAndStatusBarHeight() - 36;
              bounds.y += (this.$parent as BrowserMainView).getNavAndStatusBarHeight() + 36;
              browserView.setBounds(bounds);
              (this.$parent as BrowserMainView).showNotification = true;
              this.handler = setTimeout(
                () => {
                  ipc.send(`response-permission-${this.id}`, {
                    accept: false,
                  });
                  const bounds2 = browserView.getBounds();
                  bounds2.height -= (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
                  bounds2.y += (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
                  browserView.setBounds(bounds2);
                  (this.$parent as BrowserMainView).showNotification = false;
                  this.id = -1;
                  clearTimeout(this.handler);
                },
                10000
              );
            } else {
              this.visible = true;
              if (this.permissions[`${this.hostname}`] &&
                this.permissions[`${this.hostname}`].hasOwnProperty(`${this.permission}`)) {
                ipc.send(`response-permission-${this.id}`, {
                  accept: this.permissions[`${this.hostname}`][`${this.permission}`],
                });
              } else {
                this.type = 'permission';
                this.template = this.$t(
                  'notification.permission.request.normal',
                  { hostname: this.hostname, permission: this.permission }
                ) as string;
                const bounds2 = browserView.getBounds();
                bounds2.height -= (this.$parent as BrowserMainView).getNavAndStatusBarHeight() - 36;
                bounds2.y += (this.$parent as BrowserMainView).getNavAndStatusBarHeight() + 36;
                browserView.setBounds(bounds2);
                (this.$parent as BrowserMainView).showNotification = true;
                this.handler = setTimeout(
                  () => {
                    ipc.send(`response-permission-${this.id}`, {
                      accept: false,
                    });
                    const bounds3 = browserView.getBounds();
                    bounds3.height -= (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
                    bounds3.y += (this.$parent as BrowserMainView).getNavAndStatusBarHeight();
                    browserView.setBounds(bounds3);
                    (this.$parent as BrowserMainView).showNotification = false;
                    this.id = -1;
                    clearTimeout(this.handler);
                  },
                  5000
                );
              }
            }
          }
        }
      }
    });
  }
  beforeDestroy(): void {
    const ipc = this.$electron.ipcRenderer;
    ipc.removeAllListeners('update-available');
    ipc.removeAllListeners('request-permission');

    this.clear();
  }
}
</script>

<style scoped>
</style>
