const corrie = require('corrie')
const wildcardMatch = require('wildcard-match')
const Handler = require('./Handler')
const HandlerStore = require('./Store')
const { throwHandler, tootHandler, hookHandler } = require('./effects')


const MODES = ['auto', 'asIs', 'sync', 'async']
const MODES_STRING = MODES.join(', ')
const SETTINGS = corrie.DEFAULT_SETTINGS
const EFFECTS = {
  throw: throwHandler,
  toot: tootHandler,
  hook: hookHandler,
}

function createEvent(tooter, name, mode, args, cb) {
  args = args || []
  let event = { name, mode, args, tooter }

  if (cb) {
    event.cb = cb
  }

  return event
}

class Hooter {
  constructor(settings) {
    let effectHandlers = Object.assign({}, SETTINGS.effectHandlers, EFFECTS)
    let state = {}

    if (settings && settings.state) {
      state = Object.assign(state, settings.state)
    }

    if (settings && settings.effectHandlers) {
      effectHandlers = Object.assign(effectHandlers, settings.effectHandlers)
    }

    state.hooter = this
    settings = Object.assign({}, SETTINGS, settings, { effectHandlers, state })

    this.settings = settings
    this.corrie = corrie(settings)
    this.handlerStoreStart = new HandlerStore(Handler, this.match)
    this.handlerStore = new HandlerStore(Handler, this.match)
    this.handlerStoreEnd = new HandlerStore(Handler, this.match, true)
    this.events = {}
  }

  match(a, b) {
    return wildcardMatch('.', a, b)
  }

  wrap(...args) {
    return this.corrie(...args)
  }

  lift() {
    let clone = new this.constructor(this.settings)
    clone.origin = this
    return clone
  }

  bind(tooter) {
    let clone = this.lift()
    clone.tooter = tooter
    return clone
  }

  register(name, mode) {
    if (this.origin) {
      return this.origin.register(name, mode)
    }

    if (typeof name !== 'string' || !name.length) {
      throw new Error('An event name must be a non-empty string')
    }

    if (this.events[name]) {
      throw new Error(`Event "${name}" is already registered`)
    }

    if (!MODES.includes(mode)) {
      throw new Error(
        `An event mode must be one of the following: ${MODES_STRING}`
      )
    }

    this.events[name] = { mode }
  }

  handlers(needle) {
    if (this.origin) {
      return this.origin.handlers(needle)
    }

    let beforeHandlers = this.handlerStoreStart.get(needle)
    let handlers = this.handlerStore.get(needle)
    let afterHandlers = this.handlerStoreEnd.get(needle)

    return beforeHandlers.concat(handlers).concat(afterHandlers)
  }

  _hook(eventName, handler, mode) {
    if (this.origin) {
      return this.origin._hook(eventName, handler, mode)
    }

    if (!handler && typeof eventName === 'function') {
      handler = eventName
      eventName = '**'
    } else if (typeof eventName !== 'string') {
      throw new TypeError('An event name must be a string')
    }

    if (typeof handler !== 'function') {
      throw new TypeError('A handler must be a function')
    }

    let handlerStore

    if (mode === 'start') {
      handlerStore = this.handlerStoreStart
    } else if (mode === 'end') {
      handlerStore = this.handlerStoreEnd
    } else {
      handlerStore = this.handlerStore
    }

    return handlerStore.put(eventName, handler)
  }

  hook(eventName, handler) {
    return this._hook(eventName, handler)
  }

  hookStart(eventName, handler) {
    return this._hook(eventName, handler, 'start')
  }

  hookEnd(eventName, handler) {
    return this._hook(eventName, handler, 'end')
  }

  unhook(handler) {
    if (this.origin) {
      return this.origin.unhook(handler)
    }

    this.handlerStoreStart.del(handler)
    this.handlerStore.del(handler)
    this.handlerStoreEnd.del(handler)
  }

  next(event) {
    if (this.origin) {
      return this.origin.next(event)
    }

    if (!event || typeof event !== 'object') {
      throw new TypeError('An event must be an object')
    }

    if (typeof event.name !== 'string') {
      throw new TypeError('An event name must be a string')
    }

    if (!MODES.includes(event.mode)) {
      throw new Error(
        `An event mode must be one of the following: ${MODES_STRING}`
      )
    }

    if (event.cb && typeof event.cb !== 'function') {
      throw new TypeError('An event callback must be a function')
    }

    let handlers = this.handlers(event.name)

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

  _toot(eventName, args, cb) {
    // Do not delegate to the origin because this method creates a source-bound
    // event and then passes it to #next(), which does the delegation
    let registeredEvent = this.events[eventName]
    let mode = registeredEvent ? registeredEvent.mode : 'auto'
    let event = createEvent(this.tooter, eventName, mode, args, cb)
    return this.next(event)
  }

  toot(eventName, ...args) {
    return this._toot(eventName, args)
  }

  tootWith(eventName, cb, ...args) {
    return this._toot(eventName, args, cb)
  }
}

module.exports = Hooter
