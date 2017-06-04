const { Subject } = require('rxjs')
const corrie = require('corrie')
const wildcardMatch = require('wildcard-match')
const HookStore = require('./HookStore')
const { throwHandler, tootHandler } = require('./effects')

const MODES = ['auto', 'asIs', 'sync', 'async']
const SETTINGS = corrie.DEFAULT_SETTINGS
const EFFECTS = {
  throw: throwHandler,
  toot: tootHandler,
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
    this.hookStoreBefore = new HookStore(this.match)
    this.hookStore = new HookStore(this.match)
    this.hookStoreAfter = new HookStore(this.match, true)
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
    if (this.source && this.source.hook) {
      return this.source.hook(eventType, hook)
    }

    return this._hook(eventType, hook, this.hookStore)
  }

  hookStart(eventType, hook) {
    if (this.source && this.source.hookStart) {
      return this.source.hookStart(eventType, hook)
    }

    return this._hook(eventType, hook, this.hookStoreBefore)
  }

  hookEnd(eventType, hook) {
    if (this.source && this.source.hookEnd) {
      return this.source.hookEnd(eventType, hook)
    }

    return this._hook(eventType, hook, this.hookStoreAfter)
  }

  unhook(needle) {
    this.hookStoreBefore.del(needle)
    this.hookStore.del(needle)
    this.hookStoreAfter.del(needle)
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
      handlers.push(event.cb)
    }

    if (handlers.length === 0) {
      return
    } else if (event.mode === 'auto') {
      return this.corrie(...handlers).apply(event, event.args)
    } else {
      return this.corrie[event.mode](...handlers).apply(event, event.args)
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
