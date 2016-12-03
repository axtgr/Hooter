let { Subject } = require('rxjs');
let Hoots = require('hoots');
let Store = require('match-store');
let match = require('wildcard-match').bind(null, '.');


class Event {
  constructor(type, transform, args, fn) {
    this.type = type;
    this.transform = !!transform;
    this.args = args;
    this.time = new Date();

    if (fn) {
      this.fn = fn;
    }
  }
}


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

  on(eventType, fn) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    return this.subscribe(e => {
      if (!e || typeof e !== 'object' || !match(e.type, eventType)) {
        return;
      }

      fn(e);
    });
  }

  hook(eventType, fn) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    this.hookStore.put(eventType, fn);
  }

  emit(eventType, ...args) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    let event = new Event(eventType, false, args);
    return this.next(event);
  }

  run(eventType, fn, ...args) {
    return this._run(false, eventType, fn, args);
  }

  runSync(eventType, fn, ...args) {
    return this._run(true, eventType, fn, args);
  }

  _run(sync, eventType, fn, args) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    let event = new Event(eventType, true, args, fn);
    let hooks = this.hookStore.get(eventType);

    if (fn) {
      let wrappedFn = function wrappedFn(event, ...args) {
        return fn.apply(this, args);
      };
      hooks.push(wrappedFn);
    }

    this.next(event);

    if (sync) {
      return this.hoots.runSync(hooks, event, ...args);
    } else {
      return this.hoots.run(hooks, event, ...args);
    }
  }

  hooks(eventType) {
    eventType = eventType || '**';

    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    return this.hookStore.get(eventType);
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
