const { Subject } = require('rxjs')
const corrie = require('corrie')
const Store = require('match-store')
const match = require('wildcard-match').bind(null, '.')

class Hooter extends Subject {
  constructor(settings) {
    super()
    this.corrie = settings ? corrie(settings) : corrie
    this.hookStore = new Store({ match })
  }

  lift(operator) {
    // Rxjs subjects return an AnonymousSubject on lifting,
    // but we want to return an instance of Hooter

    let instance = new this.constructor()

    if (operator) {
      instance.operator = operator
    }

    instance.source = this
    return instance
  }

  _subscribe(subscriber) {
    if (this.source) {
      return this.source.subscribe(subscriber)
    }

    return super._subscribe(subscriber)
  }

  error(err) {
    if (this.source && this.source.error) {
      return this.source.error(err)
    }

    super.error(err)
  }

  complete() {
    if (this.source && this.source.complete) {
      return this.source.complete()
    }

    super.complete()
  }

  hook(eventType, hook) {
    if (arguments.length === 1) {
      hook = eventType
      eventType = '**'
    } else if (typeof eventType !== 'string') {
      throw new TypeError('An event type must be a string')
    }

    if (typeof hook !== 'function') {
      throw new TypeError('A hook must be a function')
    }

    this.hookStore.put(eventType, hook)
  }

  next(event) {
    if (!event || typeof event !== 'object') {
      throw new TypeError('An event must be an object')
    }

    if (typeof event.type !== 'string') {
      throw new TypeError('An event type must be a string')
    }

    if (!['asIs', 'sync', 'async'].includes(event.mode)) {
      throw new Error('An event mode must be either "asIs", "sync" or "async"')
    }

    if (event.cb && typeof event.cb !== 'function') {
      throw new TypeError('An event callback must be a function')
    }

    if (this._prefix) {
      event = Object.assign({}, event)
      event.type = `${this._prefix}.${event.type}`
    }

    if (this.source && this.source.next) {
      return this.source.next(event)
    }

    super.next(event)

    let hooks = this.hookStore.get(event.type)

    if (event.cb) {
      hooks.push(wrapCb(event.cb))
    }

    if (hooks.length === 0) {
      return
    } else if (event.mode === 'asIs') {
      return this.corrie(...hooks)(event, ...event.args)
    } else {
      return this.corrie[event.mode](...hooks)(event, ...event.args)
    }
  }

  process(eventType, ...args) {
    let event = createEvent(eventType, 'asIs', args)
    return this.next(event)
  }

  processSync(eventType, ...args) {
    let event = createEvent(eventType, 'sync', args)
    return this.next(event)
  }

  processAsync(eventType, ...args) {
    let event = createEvent(eventType, 'async', args)
    return this.next(event)
  }

  processWith(eventType, cb, ...args) {
    let event = createEvent(eventType, 'asIs', args, cb)
    return this.next(event)
  }

  processSyncWith(eventType, cb, ...args) {
    let event = createEvent(eventType, 'sync', args, cb)
    return this.next(event)
  }

  processAsyncWith(eventType, cb, ...args) {
    let event = createEvent(eventType, 'async', args, cb)
    return this.next(event)
  }

  prefix(prefix) {
    if (typeof prefix !== 'string') {
      throw new TypeError('A prefix must be a string')
    }

    let instance = this.lift()
    instance._prefix = prefix
    return instance
  }

  filter(predicate) {
    if (typeof predicate === 'string') {
      let eventType = predicate
      predicate = (e) => match(e.type, eventType)
    }

    return super.filter(predicate)
  }
}

function createEvent(type, mode, args, cb) {
  args = args || []
  let event = { type, mode, args }

  if (cb) {
    event.cb = cb
  }

  return event
}

function wrapCb(cb) {
  return function wrappedCallback(e, ...args) {
    return cb.apply(this, args)
  }
}

module.exports = Hooter
