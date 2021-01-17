/* eslint-disable no-restricted-syntax */

class Event {
  listeners: ((...args: any) => any)[];

  constructor() {
    this.listeners = [];
  }

  addListener(callback: (...args: any) => any): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (...args: any) => any): void {
    this.listeners = this.listeners.filter(c => (c !== callback));
  }

  emit(...args: any): void {
    for (const listener of this.listeners) {
      try {
        listener(...args);
      } catch (err) {
        // TODO: we got here becase we didn't clear all listeners related to certain extension
        // eslint-disable-next-line no-console
        // console.error(err);
        this.removeListener(listener);
      }
    }
  }
}

export default Event;
