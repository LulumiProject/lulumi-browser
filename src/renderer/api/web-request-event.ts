/* eslint-disable no-bitwise */

import { ipcRenderer } from 'electron';

(String.prototype as any).hashCode = function hashCode() {
  let hash = 0;
  let i;
  let chr;

  if (this.length === 0) {
    return hash;
  }
  for (i = 0; i < this.length; i += 1) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // convert to 32bit integer
  }
  return hash;
};

class Event {
  name: string;
  scope: string;
  event: string;
  listeners: ((details: any) => any)[];

  constructor(name: string, scope: string, event: string) {
    this.name = name; // extension's name
    this.scope = scope;
    this.event = event;
    this.listeners = [];
  }

  addListener(callback: (details: any) => any, filter = {}): void {
    const digest = (callback.toString() as any).hashCode();
    this.listeners.push(digest);
    ipcRenderer.on(
      `lulumi-${this.scope}-${this.event}-intercepted-${digest}`, (event, requestId, details) => {
        ipcRenderer.send(
          `lulumi-${this.scope}-${this.event}-response-${digest}-${requestId}`, callback(details)
        );
      }
    );
    ipcRenderer.send(
      `lulumi-${this.scope}-add-listener-${this.event}`,
      this.name,
      this.event,
      digest,
      filter,
    );
  }

  removeListener(callback: (details: any) => any): void {
    const digest = (callback.toString() as any).hashCode();
    this.listeners = this.listeners.filter(c => (c !== digest));
    ipcRenderer.removeAllListeners(`lulumi-${this.scope}-${this.event}-intercepted-${digest}`);
    ipcRenderer.send(`lulumi-${this.scope}-remove-listener-${this.event}`, this.name, this.event);
  }

  removeAllListeners(): void {
    this.listeners.forEach(l => ipcRenderer.removeAllListeners(
      `lulumi-${this.scope}-${this.event}-intercepted-${l}`
    ));
    ipcRenderer.send(
      `lulumi-${this.scope}-remove-listener-${this.event}`,
      this.name,
      this.event,
    );
    this.listeners = [];
  }
}

export default Event;
