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
      try {
        listener(...args);
      } catch (err) {
        this.removeListener(listener);
      }
    }
  }
}

module.exports = Event;
