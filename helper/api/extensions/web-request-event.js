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
  constructor(name, scope, event) {
    this.name = name; // extension's name
    this.scope = scope;
    this.event = event;
    this.listeners = [];
  }

  addListener(callback, filter = {}, opt_extraInfoSpec = []) {
    const digest = callback.toString().hashCode();
    this.listeners.push(digest);
    ipcRenderer.on(`lulumi-${this.scope}-${this.event}-intercepted-${digest}`, (event, details) => {
      ipcRenderer.send(`lulumi-${this.scope}-${this.event}-response-${digest}`, callback(details));
    })
    ipcRenderer.send(`lulumi-${this.scope}-add-listener-${this.event}`, this.name, this.event, digest, filter);
  }

  removeListener(callback) {
    const digest = callback.toString().hashCode();
    this.listeners = this.listeners.filter(c => (c !== digest));
    ipcRenderer.removeAllListeners(`lulumi-${this.scope}-${this.event}-intercepted-${digest}`);
    ipcRenderer.send(`lulumi-${this.scope}-remove-listener-${this.event}`, this.name, this.event);
  }

  removeAllListeners() {
    this.listeners.forEach(l => ipcRenderer.removeAllListeners(`lulumi-${this.scope}-${this.event}-intercepted-${l}`));
    ipcRenderer.send(`lulumi-${this.scope}-remove-listener-${this.event}`, this.name, this.event);
    this.listeners = [];
  }
}

module.exports = Event;
