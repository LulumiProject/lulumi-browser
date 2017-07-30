class Event {
  listeners: Function[];
  constructor() {
    this.listeners = [];
  }

  addListener(callback: Function): void {
    this.listeners.push(callback);
  }

  removeListener(callback: Function): void {
    this.listeners = this.listeners.filter(c => (c !== callback));
  }

  emit(...args): void {
    for (const listener of this.listeners) {
      try {
        listener(...args);
      } catch (err) {
        this.removeListener(listener);
      }
    }
  }
}

export default Event;
