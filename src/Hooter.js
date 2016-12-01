let Store = require('wildcard-store');
let hoots = require('hoots');

class Event {
  constructor(type, initialArgs, fn) {
    this.type = type;
    this.initialArgs = initialArgs;
    this.fn = fn;
    this.time = new Date();
  }
}

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
    let event = new Event(pattern, args);
    let eventArgs = [event].concat(args);
    let handlers = this.store.get(pattern);
    return hoots.run(handlers, ...eventArgs);
  }

  run(pattern, fn, ...args) {
    let event = new Event(pattern, args, fn);
    let eventArgs = [event].concat(args);
    let fnWrapper = function fnWrapper(e, ...args) {
      return fn.apply(this, args);
    };
    let handlers = this.store.get(pattern).concat(fnWrapper);
    return hoots.run(handlers, ...eventArgs);
  }

  listeners(pattern) {
    return this.store.get(pattern);
  }
}

module.exports = Hooter;
