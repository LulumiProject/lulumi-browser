const { ipcRenderer } = require('electron');

String.prototype.hashCode = function () {
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
  constructor(scope, event) {
    this.scope = scope;
    this.event = event;
    ipcRenderer.send(`lulumi-${this.scope}-${this.event}`);
    this.listeners = [];
  }

  addListener(callback) {
    const digest = callback.toString().hashCode();
    this.listeners.push(digest);
    ipcRenderer.on(`lulumi-${this.scope}-add-listener-${this.event}-result-${digest}`, (event, args) => {
      callback(...args);
    });
    ipcRenderer.send(`lulumi-${this.scope}-add-listener-${this.event}`, digest);
  }

  removeListener(callback) {
    const digest = callback.toString().hashCode();
    const index = this.listeners.indexOf(digest);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
    ipcRenderer.removeAllListeners(`lulumi-${this.scope}-add-listener-${this.event}-result-${digest}`);
    ipcRenderer.send(`lulumi-${this.scope}-remove-listener-${this.event}`, digest);
  }

  emit(...args) {
    ipcRenderer.send(`lulumi-${this.scope}-emit-${this.event}`, args);
  }
}

module.exports = Event;
