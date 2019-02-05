import { ipcRenderer } from 'electron';
import * as url from 'url';
import Vue from 'vue';

import apiFactory, { initializeExtensionApi } from './api-factory';

/* tslint:disable:max-line-length */

export default class ExtensionService {
  newtabOverrides: string = '';
  manifestMap: Lulumi.API.ManifestMap = {};
  instance: Vue;
  constructor(vueInstance) {
    this.instance = vueInstance;
    this.instance.$electron.ipcRenderer.once('registered-local-commands', (event, manifestMap) => {
      this.manifestMap = manifestMap;
      initializeExtensionApi(apiFactory(this.instance)).then(() => {
        this.register();
        this.registerAction();
      });
    });
    this.instance.$electron.ipcRenderer.send('register-local-commands');
  }

  register() {
    const ipc = ipcRenderer;
    const vue: any = this.instance;
    ipc.on('lulumi-env-app-name', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-env-app-name-result-${data.suffix}`, require('lulumi').env.appName());
      }
    });
    ipc.on('lulumi-env-app-version', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-env-app-version-result-${data.suffix}`, require('lulumi').env.appVersion());
      }
    });

    ipc.on('lulumi-browser-action-set-icon', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-browser-action-set-icon-result-${data.suffix}`,
          require('lulumi').browserAction.setIcon(data.extensionId, data.startPage, data.details));
      }
    });
    ipc.on('lulumi-browser-action-set-badge-text', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          'lulumi-browser-action-set-badge-text-result',
          require('lulumi').browserAction.setBadgeText(data.extensionId, data.details));
      }
    });
    ipc.on('lulumi-browser-action-set-badge-background-color', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          'lulumi-browser-action-set-badge-background-color-result',
          require('lulumi').browserAction.setBadgeBackgroundColor(data.extensionId, data.details));
      }
    });
    ipc.on('lulumi-browser-action-add-listener-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-browser-action-add-listener-on-message-result-${data.digest}`,
            args);
        };
        const onClickedEvent = require('lulumi').browserAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-browser-action-remove-listener-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-browser-action-add-listener-on-message-result-${data.digest}`,
            args);
        };
        const onClickedEvent = require('lulumi').browserAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-browser-action-emit-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onClickedEvent = require('lulumi').browserAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.emit(data.message, data.sender);
        }
      }
    });

    ipc.on('lulumi-page-action-set-icon', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-page-action-set-icon-result-${data.suffix}`,
          require('lulumi').pageAction.setIcon(data.extensionId, data.startPage, data.details));
      }
    });
    ipc.on('lulumi-page-action-show', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        vue.$store.dispatch('setPageAction', {
          tabId: data.tabId,
          extensionId: data.extensionId,
          enabled: data.enabled,
        });
      }
    });
    ipc.on('lulumi-page-action-hide', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        vue.$store.dispatch('setPageAction', {
          tabId: data.tabId,
          extensionId: data.extensionId,
          enabled: data.enabled,
        });
      }
    });
    ipc.on('lulumi-page-action-add-listener-on-clicked', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-page-action-add-listener-on-clicked-result-${data.digest}`,
            args);
        };
        const onClickedEvent = require('lulumi').pageAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-page-action-remove-listener-on-clicked', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-page-action-add-listener-on-clicked-result-${data.digest}`,
            args);
        };
        const onClickedEvent = require('lulumi').pageAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-page-action-emit-on-clicked', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onClickedEvent = require('lulumi').pageAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.emit(data.args, data.sender);
        }
      }
    });

    ipc.on('lulumi-commands-add-listener-on-command', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-commands-add-listener-on-command-result-${data.digest}`,
            args);
        };
        const onCommandEvent = require('lulumi').commands.onCommand(data.webContentsId);
        if (onCommandEvent) {
          onCommandEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-commands-remove-listener-on-command', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-commands-add-listener-on-command-result-${data.digest}`,
            args);
        };
        const onCommandEvent = require('lulumi').commands.onCommand(data.webContentsId);
        if (onCommandEvent) {
          onCommandEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-commands-emit-on-command', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onCommandEvent = require('lulumi').commands.onCommand(data.webContentsId);
        if (onCommandEvent) {
          onCommandEvent.emit(data.args);
        }
      }
    });

    ipc.on('lulumi-alarms-get', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(`lulumi-alarms-get-result-${data.suffix}`, vue.getAlarm(data.name));
      }
    });
    ipc.on('lulumi-alarms-get-all', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(`lulumi-alarms-get-all-result-${data.suffix}`, vue.getAllAlarm());
      }
    });
    ipc.on('lulumi-alarms-clear', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(`lulumi-alarms-clear-result-${data.suffix}`, vue.clearAlarm(data.name));
      }
    });
    ipc.on('lulumi-alarms-clear-all', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(`lulumi-alarms-clear-all-result-${data.suffix}`, vue.clearAllAlarm());
      }
    });
    ipc.on('lulumi-alarms-create', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        vue.createAlarm(data.name, data.alarmInfo);
      }
    });
    ipc.on('lulumi-alarms-add-listener-on-alarm', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-alarms-add-listener-on-alarm-result-${data.digest}`, args);
        };
        const onAlarmEvent = vue.onAlarmEvent;
        if (onAlarmEvent) {
          onAlarmEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-alarms-remove-listener-on-alarm', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-alarms-add-listener-on-alarm-result-${data.digest}`, args);
        };
        const onAlarmEvent = vue.onAlarmEvent;
        if (onAlarmEvent) {
          onAlarmEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-alarms-emit-on-alarm', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onAlarmEvent = vue.onAlarmEvent;
        if (onAlarmEvent) {
          onAlarmEvent.emit(data.alarm, data.sender);
        }
      }
    });

    ipc.on('lulumi-runtime-send-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').runtime.sendMessage(
          data.extensionId,
          data.message,
          data.external,
          data.webContentsId);
      }
    });
    ipc.on('lulumi-runtime-add-listener-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-runtime-add-listener-on-message-result-${data.digest}`, args);
        };
        const onMessageEvent = require('lulumi').runtime.onMessage(data.webContentsId);
        if (onMessageEvent) {
          onMessageEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-runtime-remove-listener-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-runtime-add-listener-on-message-result-${data.digest}`, args);
        };
        const onMessageEvent = require('lulumi').runtime.onMessage(data.webContentsId);
        if (onMessageEvent) {
          onMessageEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-runtime-emit-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onMessageEvent = require('lulumi').runtime.onMessage(data.webContentsId);
        if (onMessageEvent) {
          onMessageEvent.emit(data.message, data.sender);
        }
      }
    });
    ipc.on('lulumi-runtime-add-listener-on-message-external', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-runtime-add-listener-on-message-external-result-${data.digest}`, args);
        };
        const onMessageExternalEvent = require('lulumi').runtime.onMessageExternal(data.webContentsId);
        if (onMessageExternalEvent) {
          onMessageExternalEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-runtime-remove-listener-on-message-external', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-runtime-add-listener-on-message-external-result-${data.digest}`, args);
        };
        const onMessageExternalEvent = require('lulumi').runtime.onMessageExternal(data.webContentsId);
        if (onMessageExternalEvent) {
          onMessageExternalEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('lulumi-runtime-emit-on-message-external', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onMessageExternalEvent = require('lulumi').runtime.onMessageExternal(data.webContentsId);
        if (onMessageExternalEvent) {
          onMessageExternalEvent.emit(data.message, data.sender);
        }
      }
    });

    ipc.on('lulumi-tabs-get', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-get-result-${data.suffix}`, require('lulumi').tabs.get(data.tabId));
      }
    });
    ipc.on('lulumi-tabs-get-current', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-get-current-result-${data.suffix}`, require('lulumi').tabs.getCurrent(data.guestInstanceId));
      }
    });
    ipc.on('lulumi-tabs-duplicate', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-duplicate-result-${data.suffix}`, require('lulumi').tabs.duplicate(data.tabId));
      }
    });
    ipc.on('lulumi-tabs-query', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-query-result-${data.suffix}`, require('lulumi').tabs.query(data.queryInfo));
      }
    });
    ipc.on('lulumi-tabs-update', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-update-result-${data.suffix}`,
          require('lulumi').tabs.update(data.tabId, data.updateProperties));
      }
    });
    ipc.on('lulumi-tabs-reload', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-reload-result-${data.suffix}`,
          require('lulumi').tabs.reload(data.tabId, data.reloadProperties));
      }
    });
    ipc.on('lulumi-tabs-create', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-create-result-${data.suffix}`, require('lulumi').tabs.create(data.createProperties));
      }
    });
    ipc.on('lulumi-tabs-remove', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-remove-result-${data.suffix}`,
          require('lulumi').tabs.remove(data.tabIds));
      }
    });
    ipc.on('lulumi-tabs-detect-language', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').tabs.detectLanguage(data.tabId, data.suffix, data.webContentsId);
      }
    });
    ipc.on('lulumi-tabs-detect-language-result', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(`lulumi-tabs-detect-language-result-${data.suffix}`, data.value);
      }
    });
    ipc.on('lulumi-tabs-execute-script', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-execute-script-result-${data.suffix}`,
          require('lulumi').tabs.executeScript(data.tabId, data.details));
      }
    });
    ipc.on('lulumi-tabs-insert-css', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-insert-css-result-${data.suffix}`,
          require('lulumi').tabs.insertCSS(data.tabId, data.details));
      }
    });
    ipc.on('lulumi-tabs-send-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-tabs-send-message-result-${data.suffix}`,
          require('lulumi').tabs.sendMessage(data.tabId, data.message));
      }
    });
    ipc.on('lulumi-tabs-add-listener-on-activated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-tabs-add-listener-on-activated-result-${data.digest}`, args);
        };
        require('lulumi').tabs.onActivated.addListener(wrapper);
      }
    });
    ipc.on('lulumi-tabs-remove-listener-on-activated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-tabs-add-listener-on-activated-result-${data.digest}`, args);
        };
        require('lulumi').tabs.onActivated.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-tabs-emit-on-activated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').tabs.onActivated.emit(data.args);
      }
    });
    ipc.on('lulumi-tabs-add-listener-on-updated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-tabs-add-listener-on-updated-result-${data.digest}`, args);
        };
        require('lulumi').tabs.onUpdated.addListener(wrapper);
      }
    });
    ipc.on('lulumi-tabs-remove-listener-on-updated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-tabs-add-listener-on-updated-result-${data.digest}`, args);
        };
        require('lulumi').tabs.onUpdated.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-tabs-emit-on-updated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').tabs.onUpdated.emit(data.args);
      }
    });
    ipc.on('lulumi-tabs-add-listener-on-created', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-tabs-add-listener-on-created-result-${data.digest}`, args);
        };
        require('lulumi').tabs.onCreated.addListener(wrapper);
      }
    });
    ipc.on('lulumi-tabs-remove-listener-on-created', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-tabs-add-listener-on-created-result-${data.digest}`, args);
        };
        require('lulumi').tabs.onCreated.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-tabs-emit-on-created', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').tabs.onCreated.emit(data.args);
      }
    });
    ipc.on('lulumi-tabs-add-listener-on-removed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-tabs-add-listener-on-removed-result-${data.digest}`, args);
        };
        require('lulumi').tabs.onRemoved.addListener(wrapper);
      }
    });
    ipc.on('lulumi-tabs-remove-listener-on-removed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-tabs-add-listener-on-removed-result-${data.digest}`, args);
        };
        require('lulumi').tabs.onRemoved.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-tabs-emit-on-removed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').tabs.onRemoved.emit(data.args);
      }
    });

    ipc.on('lulumi-windows-get', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-windows-get-result-${data.suffix}`, require('lulumi').windows.get(data.windowId, data.getInfo));
      }
    });
    ipc.on('lulumi-windows-get-current', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-windows-get-current-result-${data.suffix}`, require('lulumi').windows.getCurrent(data.getInfo, data.guestInstanceId));
      }
    });
    ipc.on('lulumi-windows-get-all', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-windows-get-all-result-${data.suffix}`, require('lulumi').windows.getAll(data.getInfo));
      }
    });

    ipc.on('lulumi-storage-add-listener-on-changed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-storage-add-listener-on-changed-result-${data.digest}`, args);
        };
        require('lulumi').storage.onChanged.addListener(wrapper);
      }
    });
    ipc.on('lulumi-storage-remove-listener-on-changed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`lulumi-storage-add-listener-on-changed-result-${data.digest}`, args);
        };
        require('lulumi').storage.onChanged.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-storage-emit-on-changed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').storage.onChanged.emit(data.args);
      }
    });

    ipc.on('lulumi-context-menus-create', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-context-menus-create-result-${data.suffix}`,
          require('lulumi').contextMenus.create(data.menuItems, data.webContentsId));
      }
    });
    ipc.on('lulumi-context-menus-remove', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-context-menus-remove-result-${data.suffix}`,
          require('lulumi').contextMenus.remove(data.menuItems, data.webContentsId));
      }
    });
    ipc.on('lulumi-context-menus-remove-all', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `lulumi-context-menus-remove-all-result-${data.suffix}`,
          require('lulumi').contextMenus.removeAll(data.menuItems, data.webContentsId));
      }
    });

    ipc.on('lulumi-web-navigation-get-frame', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').webNavigation.getFrame(data.details, data.suffix, data.webContentsId);
      }
    });
    ipc.on('lulumi-web-navigation-get-frame-result', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(`lulumi-web-navigation-get-frame-result-${data.suffix}`, data.details);
      }
    });
    ipc.on('lulumi-web-navigation-get-all-frames', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').webNavigation.getAllFrames(data.details, data.suffix, data.webContentsId);
      }
    });
    ipc.on('lulumi-web-navigation-get-all-frames-result', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(`lulumi-web-navigation-get-all-frames-result-${data.suffix}`, data.details);
      }
    });
    ipc.on('lulumi-web-navigation-add-listener-on-before-navigate', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-before-navigate-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onBeforeNavigate.addListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-remove-listener-on-before-navigate', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-before-navigate-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onBeforeNavigate.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-emit-on-before-navigate', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').webNavigation.onBeforeNavigate.emit(data.args);
      }
    });
    ipc.on('lulumi-web-navigation-add-listener-on-committed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-committed-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onCommitted.addListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-remove-listener-on-committed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-committed-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onCommitted.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-emit-on-committed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').webNavigation.onCommitted.emit(data.args);
      }
    });
    ipc.on('lulumi-web-navigation-add-listener-on-dom-content-loaded', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-dom-content-loaded-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onDOMContentLoaded.addListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-remove-listener-on-dom-content-loaded', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-dom-content-loaded-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onDOMContentLoaded.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-emit-on-dom-content-loaded', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').webNavigation.onDOMContentLoaded.emit(data.args);
      }
    });
    ipc.on('lulumi-web-navigation-add-listener-on-completed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-completed-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onCompleted.addListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-remove-listener-on-completed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-completed-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onCompleted.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-emit-on-completed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').webNavigation.onCompleted.emit(data.args);
      }
    });
    ipc.on('lulumi-web-navigation-add-listener-on-created-navigation-target', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-created-navigation-target-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onCreatedNavigationTarget.addListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-remove-listener-on-created-navigation-target', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `lulumi-web-navigation-add-listener-on-created-navigation-target-result-${data.digest}`,
            args);
        };
        require('lulumi').webNavigation.onCreatedNavigationTarget.removeListener(wrapper);
      }
    });
    ipc.on('lulumi-web-navigation-emit-on-created-navigation-target', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('lulumi').webNavigation.onCreatedNavigationTarget.emit(data.args);
      }
    });
    ipc.on('lulumi-web-request-intercepted', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const details = data.details;
        const requestId = data.requestId;
        const tab = require('lulumi').tabs.query({ webContentsId: details.webContentsId })[0];

        details.tabId = (tab === undefined) ? -1 : tab.id;
        webContents.send(
          `lulumi-web-request-${data.eventLispCaseName}-intercepted-${data.digest}`,
          requestId,
          details);
      }
    });
  }

  update(): void {
    this.instance.$electron.ipcRenderer.once('registered-local-commands', (event, manifestMap) => {
      initializeExtensionApi(apiFactory(this.instance)).then(() => {
        this.manifestMap = manifestMap;
        this.register();
        this.registerAction();
      });
    });
    this.instance.$electron.ipcRenderer.send('register-local-commands');
  }

  registerAction() {
    const manifest: Lulumi.API.ManifestObject[] = [];
    const remote = this.instance.$electron.remote;
    const backgroundPages = remote.getGlobal('backgroundPages');

    this.newtabOverrides = '';
    Object.keys(this.manifestMap).forEach((extension) => {
      const ext = this.manifestMap[extension];
      if (ext) {
        if (backgroundPages[extension]) {
          const webContentsId = backgroundPages[extension].webContentsId;
          ext.webContentsId = webContentsId;
        }
        const cuo = ext.chrome_url_overrides;
        if (cuo) {
          Object.keys(cuo).forEach((k) => {
            this[`${k}Overrides`] = `${url.format({
              protocol: 'lulumi-extension',
              slashes: true,
              hostname: ext.extensionId,
              pathname: cuo[k],
            })}`;
          });
        }
        manifest.push(ext);
      }
    });

    (this.instance.$refs.navbar as any).extensions = manifest;
  }
}
