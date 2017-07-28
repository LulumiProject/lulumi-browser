class Event {
  constructor() {
    this.listeners = [];
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(c => (c !== callback));
  }

  emit(...args) {
    for (const listener of this.listeners) {
      listener(...args);
    }
  }
}

module.exports = Event;
