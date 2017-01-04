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

  process(options, ...args) {
    return process.call(this, options, null, args);
  }

  processSync(options, ...args) {
    return process.call(this, options, null, args, 'sync');
  }

  processAsync(options, ...args) {
    return process.call(this, options, null, args, 'async');
  }

  processWith(options, cb, ...args) {
    return process.call(this, options, cb, args);
  }

  processSyncWith(options, cb, ...args) {
    return process.call(this, options, cb, args, 'sync');
  }

  processAsyncWith(options, cb, ...args) {
    return process.call(this, options, cb, args, 'async');
  }

  hooks(eventType) {
    eventType = eventType || '**';

    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    return this.hookStore.get(eventType);
  }
}


function process(options, cb, args, mode) {
  let eventType = options;
  let params;

  if (options && typeof options === 'object') {
    eventType = options.event;
    params = options.params;
  }

  if (typeof eventType !== 'string') {
    throw new TypeError('Event type must be a string');
  }

  cb = (typeof cb === 'function') ? cb : undefined;
  let event = new Event(eventType, true, args, cb);
  args = [event].concat(args);
  let handlers = this.hookStore.get(eventType);

  if (cb) {
    handlers.push(wrapCb(cb));
  }

  this.next(event);

  return this.hoots.execute({ handlers, args, params, mode });
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
