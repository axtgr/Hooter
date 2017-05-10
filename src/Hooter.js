const { Subject } = require('rxjs')
const corrie = require('corrie')
const wildcardMatch = require('wildcard-match')
const HookStore = require('./HookStore')

class Hooter extends Subject {
  constructor(settings) {
    super()
    this.corrie = settings ? corrie(settings) : corrie
    this.hookStoreBefore = new HookStore(this.match)
    this.hookStore = new HookStore(this.match)
    this.hookStoreAfter = new HookStore(this.match, true)
  }

  match(a, b) {
    return wildcardMatch('.', a, b)
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

  _hook(eventType, hook, hookStore) {
    if (arguments.length === 1) {
      hook = eventType
      eventType = '**'
    } else if (typeof eventType !== 'string') {
      throw new TypeError('An event type must be a string')
    }

    if (typeof hook !== 'function') {
      throw new TypeError('A hook must be a function')
    }

    return hookStore.put(eventType, hook)
  }

  hook(eventType, hook) {
    return this._hook(eventType, hook, this.hookStore)
  }

  hookBefore(eventType, hook) {
    return this._hook(eventType, hook, this.hookStoreBefore)
  }

  hookAfter(eventType, hook) {
    return this._hook(eventType, hook, this.hookStoreAfter)
  }

  next(event) {
    if (!event || typeof event !== 'object') {
      throw new TypeError('An event must be an object')
    }

    if (typeof event.type !== 'string') {
      throw new TypeError('An event type must be a string')
    }

    if (!['auto', 'asIs', 'sync', 'async'].includes(event.mode)) {
      throw new Error(
        'An event mode must be either "auto", asIs", "sync" or "async"'
      )
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

    let beforeHooks = this.hookStoreBefore.get(event.type)
    let hooks = this.hookStore.get(event.type)
    let afterHooks = this.hookStoreAfter.get(event.type)
    let handlers = beforeHooks
      .concat(hooks)
      .concat(afterHooks)
      .map((hook) => hook.fn)

    if (event.cb) {
      handlers.push(wrapCb(event.cb))
    }

    if (handlers.length === 0) {
      return
    } else if (event.mode === 'auto') {
      return this.corrie(...handlers)(event, ...event.args)
    } else {
      return this.corrie[event.mode](...handlers)(event, ...event.args)
    }
  }

  toot(eventType, ...args) {
    let event = createEvent(eventType, 'auto', args)
    return this.next(event)
  }

  tootAsIs(eventType, ...args) {
    let event = createEvent(eventType, 'asIs', args)
    return this.next(event)
  }

  tootSync(eventType, ...args) {
    let event = createEvent(eventType, 'sync', args)
    return this.next(event)
  }

  tootAsync(eventType, ...args) {
    let event = createEvent(eventType, 'async', args)
    return this.next(event)
  }

  tootWith(eventType, cb, ...args) {
    let event = createEvent(eventType, 'auto', args, cb)
    return this.next(event)
  }

  tootAsIsWith(eventType, cb, ...args) {
    let event = createEvent(eventType, 'asIs', args, cb)
    return this.next(event)
  }

  tootSyncWith(eventType, cb, ...args) {
    let event = createEvent(eventType, 'sync', args, cb)
    return this.next(event)
  }

  tootAsyncWith(eventType, cb, ...args) {
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
      predicate = (e) => this.match(e.type, eventType)
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
