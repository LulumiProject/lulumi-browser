class Event {
  listeners: Function[];
  constructor() {
    this.listeners = [];
  }

  addListener(callback: Function): void {
    this.listeners.push(callback);
  }

  removeListener(callback: Function): void {
    const index: number = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  emit(...args): void {
    for (const listener of this.listeners) {
      listener(...args);
    }
  }
}

export default Event;
