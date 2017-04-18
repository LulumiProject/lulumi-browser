const { ipcRenderer } = require('electron');

String.prototype.hashCode = () => {
  let hash = 0;
  let i;
  let chr;

  if (this.length === 0) {
    return hash;
  }
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // convert to 32bit integer
  }
  return hash;
};

class Event {
  constructor(handler) {
    this.handler = handler;
    ipcRenderer.send(`lulumi-tabs-${this.handler}`);
    this.listeners = [];
  }

  addListener(callback) {
    const digest = callback.toString().hashCode();
    this.listeners.push(digest);
    ipcRenderer.on(`lulumi-tabs-add-listener-${this.handler}-result-${digest}`, (event, args) => {
      callback(args);
    });
    ipcRenderer.send(`lulumi-tabs-add-listener-${this.handler}`, digest);
  }

  removeListener(callback) {
    const digest = callback.toString().hashCode();
    const index = this.listeners.indexOf(digest);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
    ipcRenderer.removeAllListeners([`lulumi-tabs-add-listener-${this.handler}-result-${digest}`]);
    ipcRenderer.send(`lulumi-tabs-remove-listener-${this.handler}`, digest);
  }

  emit(...args) {
    ipcRenderer.send(`lulumi-tabs-emit-${this.handler}`, args);
  }
}

module.exports = Event;
