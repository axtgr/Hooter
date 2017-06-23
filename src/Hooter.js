const { Subject } = require('rxjs')
const corrie = require('corrie')
const wildcardMatch = require('wildcard-match')
const HandlerStore = require('./HandlerStore')
const { throwHandler, tootHandler, hookHandler } = require('./effects')

const MODES = ['auto', 'asIs', 'sync', 'async']
const SETTINGS = corrie.DEFAULT_SETTINGS
const EFFECTS = {
  throw: throwHandler,
  toot: tootHandler,
  hook: hookHandler,
}

class Hooter extends Subject {
  constructor(settings) {
    super()

    let effectHandlers = Object.assign({}, SETTINGS.effectHandlers, EFFECTS)
    let state = { hooter: this }

    if (settings) {
      state = settings.state ? Object.assign(state, settings.state) : state
      effectHandlers = settings.effectHandlers
        ? Object.assign(effectHandlers, settings.effectHandlers)
        : state
    }

    settings = Object.assign({}, SETTINGS, settings, { effectHandlers, state })
    this.corrie = corrie(settings)
    this.handlerStoreBefore = new HandlerStore(this.match)
    this.handlerStore = new HandlerStore(this.match)
    this.handlerStoreAfter = new HandlerStore(this.match, true)
    this.events = {}
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

  _hook(eventType, handler, handlerStore) {
    if (arguments.length === 1) {
      handler = eventType
      eventType = '**'
    } else if (typeof eventType !== 'string') {
      throw new TypeError('An event type must be a string')
    }

    if (typeof handler !== 'function') {
      throw new TypeError('A handler must be a function')
    }

    return handlerStore.put(eventType, handler)
  }

  hook(eventType, handler) {
    if (this.source && this.source.hook) {
      return this.source.hook(eventType, handler)
    }

    return this._hook(eventType, handler, this.handlerStore)
  }

  hookStart(eventType, handler) {
    if (this.source && this.source.hookStart) {
      return this.source.hookStart(eventType, handler)
    }

    return this._hook(eventType, handler, this.handlerStoreBefore)
  }

  hookEnd(eventType, handler) {
    if (this.source && this.source.hookEnd) {
      return this.source.hookEnd(eventType, handler)
    }

    return this._hook(eventType, handler, this.handlerStoreAfter)
  }

  unhook(handler) {
    this.handlerStoreBefore.del(handler)
    this.handlerStore.del(handler)
    this.handlerStoreAfter.del(handler)
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

    let beforeHandlers = this.handlerStoreBefore.get(event.type)
    let handlers = this.handlerStore.get(event.type)
    let afterHandlers = this.handlerStoreAfter.get(event.type)
    let allHandlers = beforeHandlers
      .concat(handlers)
      .concat(afterHandlers)
      .map((handler) => handler.fn)

    if (event.cb) {
      allHandlers.push(event.cb)
    }

    if (allHandlers.length === 0) {
      return
    } else if (event.mode === 'auto') {
      return this.corrie(...allHandlers).apply(event, event.args)
    } else {
      return this.corrie[event.mode](...allHandlers).apply(event, event.args)
    }
  }

  _toot(eventType, args, cb) {
    let registeredEvent = this.events[eventType]
    let mode = registeredEvent ? registeredEvent.mode : 'auto'
    let event = createEvent(this.tooter, eventType, mode, args, cb)
    return this.next(event)
  }

  toot(eventType, ...args) {
    return this._toot(eventType, args)
  }

  tootWith(eventType, cb, ...args) {
    return this._toot(eventType, args, cb)
  }

  register(eventType, mode) {
    if (this.source && this.source.register) {
      return this.source.register(eventType, mode)
    }

    if (typeof eventType !== 'string' || !eventType.length) {
      throw new Error('An event type must be a non-empty string')
    }

    if (this.events[eventType]) {
      throw new Error(`Event "${eventType}" is already registered`)
    }

    if (!MODES.includes(mode)) {
      throw new Error('A mode must be one of the following:', MODES.join(', '))
    }

    this.events[eventType] = { mode }
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

  bind(tooter) {
    let clone = this.lift()
    clone.tooter = tooter
    return clone
  }

  wrap(...args) {
    return this.corrie(...args)
  }
}

function createEvent(source, type, mode, args, cb) {
  args = args || []
  let event = { type, mode, args, source }

  if (cb) {
    event.cb = cb
  }

  return event
}

module.exports = Hooter
