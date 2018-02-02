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
        // (TODO) we got here becase we didn't clear all listeners related to certain extension
        // console.error(err);
        this.removeListener(listener);
      }
    }
  }
}

module.exports = Event;
