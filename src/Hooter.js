let Store = require('wildcard-store');
let hoots = require('hoots');

class Hooter {
  constructor() {
    this.store = new Store();
  }

  on(key, fn, limit) {
    return this.store.set(key, fn, limit);
  }

  once(key, fn) {
    return this.store.set(key, fn, 1);
  }

  off(key, fn) {
    return this.store.del(key, fn);
  }

  emit(pattern, ...args) {
    let handlers = this.store.get(pattern);
    return hoots.run(handlers, args);
  }

  run(pattern, fn, ...args) {
    let handlers = this.store.get(pattern).concat(fn);
    return hoots.run(handlers, args);
  }

  listeners(pattern) {
    return this.store.get(pattern);
  }
}

Hooter.next = hoots.next;
Hooter.dialog = hoots.dialog;

module.exports = Hooter;
