/* eslint-disable max-len */

import { ipcRenderer } from 'electron';
import Event from './event';

class MessageSender {
  frameId: number;
  id: string;
  tab: Lulumi.Store.TabObject;
  url: string;

  constructor(extensionId) {
    // TODO: fix this
    this.frameId = 0;
    this.id = extensionId;
    this.url = `lulumi-extension://${extensionId}`;
  }

  setTab(tab) {
    this.tab = tab;
  }
}

function invalidateEvent(event: Event) {
  event.listeners.length = 0;
}

class Port {
  ports: Port[] = [];
  portId: number;
  disconnected: boolean;
  otherEnd: boolean;
  extensionId: string;
  connectInfo: any;
  scriptType: string;
  responseScriptType: string | null;
  webContentsId: number | null;
  name: string;
  onDisconnect: Event;
  onMessage: Event;
  sender: MessageSender;

  constructor(portId: number, extensionId: string, connectInfo: any, scriptType: string, responseScriptType: string | null, webContentsId: number | null) {
    this.portId = portId;
    this.disconnected = false;
    this.otherEnd = false;
    this.extensionId = extensionId;
    this.connectInfo = connectInfo;
    this.scriptType = scriptType;
    this.responseScriptType = responseScriptType;
    this.webContentsId = webContentsId;
    if (connectInfo) {
      if (connectInfo.hasOwnProperty('name')) {
        this.name = connectInfo.name;
      } else {
        this.name = this.extensionId;
      }
    } else {
      this.name = this.extensionId;
    }
    this.onDisconnect = new Event();
    this.onMessage = new Event();
    this.sender = new MessageSender(this.extensionId);
    const port = this.ports[portId];
    if (port) {
      throw new Error(`Port '${portId}' already exists.`);
    }
    this.ports[portId] = this;
    this._init();
  }

  _init(): void {
    ipcRenderer.on(`lulumi-runtime-port-${this.extensionId}-${this.name}`, (event, message) => {
      // https://developer.chrome.com/extensions/runtime#property-Port-onMessage
      this.onMessage.emit(message, this);
    });
    ipcRenderer.once(`lulumi-runtime-port-${this.extensionId}-${this.name}-disconnect`, () => {
      // https://developer.chrome.com/extensions/runtime#property-Port-onDisconnect
      this.onDisconnect.emit(this);
      this.otherEnd = true;
      this.disconnect();
    });
    if (this.responseScriptType) {
      require('electron').remote.webContents.fromId(this.webContentsId)
        .send('lulumi-runtime-before-connect', this.extensionId, this.connectInfo, this.scriptType);
    } else {
      const extension = ipcRenderer.sendSync('get-background-pages')[this.extensionId];
      require('electron').remote.webContents.fromId(extension.webContentsId).send(
        'lulumi-runtime-before-connect',
        this.extensionId,
        this.connectInfo,
        this.scriptType,
        require('electron').remote.getCurrentWebContents().id,
      );
      this.updateResponse(extension.webContentsId);
    }
  }

  updateResponse(webContentsId: number): void {
    this.webContentsId = webContentsId;
  }

  updateResponseScriptType(responseScriptType: string): void {
    this.responseScriptType = responseScriptType;
  }

  disconnect(): void {
    if (this.disconnected) {
      return;
    }
    this._onDisconnect();
  }

  postMessage(message: any): void {
    require('electron').remote.webContents.fromId(this.webContentsId).send(
      `lulumi-runtime-port-${this.extensionId}-${this.name}`,
      message,
    );
  }

  _onDisconnect(): void {
    this.disconnected = true;
    ipcRenderer.removeAllListeners(`lulumi-runtime-port-${this.extensionId}-${this.name}`);
    if (!this.otherEnd) {
      ipcRenderer.removeAllListeners(
        `lulumi-runtime-port-${this.extensionId}-${this.name}-disconnect`
      );
      require('electron').remote.webContents.fromId(this.webContentsId)
        .send(`lulumi-runtime-port-${this.extensionId}-${this.name}-disconnect`);
    }
    // https://developer.chrome.com/extensions/runtime#property-Port-onDisconnect
    this._Destroy();
  }

  _Destroy(): void {
    invalidateEvent(this.onDisconnect);
    invalidateEvent(this.onMessage);
    delete this.ports[this.portId];
  }
}

export default Port;
