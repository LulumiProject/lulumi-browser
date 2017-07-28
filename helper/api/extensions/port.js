const Event = require('./event');
const { ipcRenderer, remote } = require('electron');

class MessageSender {
  constructor (extensionId) {
    this.id = extensionId;
    this.url = `lulumi-extension://${extensionId}`;
  }
}

class Port {
  constructor(extensionId, connectInfo, scriptType, responseScriptType, webContentsId) {
    this.disconnected = false;
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
    process.nextTick(this._init.bind(this));
  }

  _init() {
    ipcRenderer.on(`lulumi-runtime-port-${this.extensionId}`, (event, message) => {
      // https://developer.chrome.com/extensions/runtime#property-Port-onMessage
      this.onMessage.emit(message, this);
    });
    if (this.responseScriptType) {
      remote.webContents.fromId(this.webContentsId).send('lulumi-runtime-before-connect', this.extensionId, this.connectInfo, this.scriptType);
    } else {
      const extension = remote.getGlobal('backgroundPages')[this.extensionId];
      remote.webContents.fromId(extension.webContentsId).send('lulumi-runtime-before-connect', this.extensionId, this.connectInfo, this.scriptType, remote.getCurrentWebContents().id);
      this.updateResponse(extension.webContentsId);
    }
  }

  updateResponse(webContentsId) {
    this.webContentsId = webContentsId;
  }

  updateResponseScriptType(responseScriptType) {
    this.responseScriptType = responseScriptType;
  }

  disconnect () {
    if (this.disconnected) {
      return;
    }
    this._onDisconnect();
  }

  postMessage (message) {
    process.nextTick(() => {
      remote.webContents.fromId(this.webContentsId).send(`lulumi-runtime-port-${this.extensionId}`, message);
    });
  }

  _onDisconnect () {
    this.disconnected = true;
    ipcRenderer.removeAllListeners(`lulumi-runtime-port-${this.extensionId}`);
    // https://developer.chrome.com/extensions/runtime#property-Port-onDisconnect
    this.onDisconnect.emit(this);
  }
}

module.exports = Port;
