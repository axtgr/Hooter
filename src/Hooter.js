let { Subject } = require('rxjs');
let Hoots = require('hoots');
let Store = require('match-store');
let match = require('wildcard-match').bind(null, '.');


const GENERATOR_PROTO = Object.getPrototypeOf(function*() {});


class Hooter extends Subject {
  constructor(settings) {
    super();

    this.hoots = settings ? new Hoots(settings) : Hoots;
    this.hookStore = new Store({ match });
  }

  lift(operator) {
    let subject = new DerivedHooter(this, this);
    subject.operator = operator;
    return subject;
  }

  on(eventType, handler) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    return this.subscribe(e => {
      if (!e || typeof e !== 'object' || !match(e.type, eventType)) {
        return;
      }

      handler(e);
    });
  }

  hook(eventType, handler) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    this.hookStore.put(eventType, handler);
  }

  emit(eventType, ...args) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    let event = new Event(eventType, false, args);
    return this.next(event);
  }

  process(eventType, ...args) {
    return process.call(this, eventType, null, args, false);
  }

  processSync(eventType, ...args) {
    return process.call(this, eventType, null, args, true);
  }

  processWith(eventType, cb, ...args) {
    return process.call(this, eventType, cb, args, false);
  }

  processWithSync(eventType, cb, ...args) {
    return process.call(this, eventType, cb, args, true);
  }

  hooks(eventType) {
    eventType = eventType || '**';

    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    return this.hookStore.get(eventType);
  }
}


function process(eventType, cb, args, sync) {
  if (typeof eventType !== 'string') {
    throw new TypeError('Event type must be a string');
  }

  cb = (typeof cb === 'function') ? cb : undefined;
  let event = new Event(eventType, true, args, cb);
  let hooks = this.hookStore.get(eventType);

  if (cb) {
    let wrappedCb = wrapCb(cb);
    hooks.push(wrappedCb);
  }

  this.next(event);

  if (sync) {
    return this.hoots.runSync(hooks, event, ...args);
  } else {
    return this.hoots.run(hooks, event, ...args);
  }
}


function wrapCb(cb) {
  if (GENERATOR_PROTO.isPrototypeOf(cb)) {
    return function* wrappedCallback(event, ...args) {
      return yield* cb.apply(this, args);
    };
  } else {
    return function wrappedCallback(event, ...args) {
      return cb.apply(this, args);
    };
  }
}


class Event {
  constructor(type, transform, args, cb) {
    this.type = type;
    this.transform = !!transform;
    this.args = args;
    this.time = new Date();

    if (cb) {
      this.cb = cb;
    }
  }
}


class DerivedHooter extends Hooter {
  constructor(destination, source) {
    super();
    this.source = source;
  }

  next(value) {
    let destination = this.destination;
    if (destination && destination.next) {
      destination.next(value);
    }
  }

  error(err) {
    let destination = this.destination;
    if (destination && destination.error) {
      this.destination.error(err);
    }
  }

  complete() {
    let destination = this.destination;
    if (destination && destination.complete) {
      this.destination.complete();
    }
  }

  _subscribe(subscriber) {
    if (this.source) {
      return this.source.subscribe(subscriber);
    } else {
      return Subscription.EMPTY;
    }
  }
}


module.exports = Hooter;
