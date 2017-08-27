const corrie = require('corrie')
const wildcardMatch = require('wildcard-match')
const Routine = require('./Routine')
const HandlerStore = require('./Store')
const {
  throwHandler,
  tootHandler,
  hookHandler,
  forkHandler,
} = require('./effects')


const MODES = ['auto', 'asIs', 'sync', 'async']
const MODES_STRING = MODES.join(', ')
const SETTINGS = corrie.DEFAULT_SETTINGS
const EFFECTS = {
  throw: throwHandler,
  toot: tootHandler,
  hook: hookHandler,
  fork: forkHandler,
}

function createEvent(tooter, name, mode, args, cb) {
  args = args || []
  mode = mode || 'auto'

  let event = { name, mode, args }

  if (tooter) {
    event.tooter = tooter
  }

  if (cb) {
    event.cb = cb
  }

  return event
}

function match(a, b) {
  return wildcardMatch('.', a, b)
}

function unhook() {
  if (!this.hooter) {
    throw new Error('A hooter is not defined on the routine')
  }

  this.hooter.unhook(this)
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
    this.store = new HandlerStore(this.matchHandler)
    this.events = {}
  }

  match(a, b) {
    return match(a, b)
  }

  matchHandler(handler, needle) {
    return handler === needle || match(handler.key, needle)
  }

  wrap(fn) {
    let routine = Routine(this, fn)
    return this.corrie(routine)
  }

  lift() {
    // NEEDS OPTIMIZATION
    // The clone here undergoes a whole construction process
    // and is then never used directly
    let clone = new this.constructor(this.settings)
    clone.source = this
    return clone
  }

  bind(owner) {
    let clone = this.lift()
    clone.owner = owner
    return clone
  }

  register(name, mode) {
    if (this.source) {
      return this.source.register(name, mode)
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

  getEvent(name) {
    if (this.source) {
      return this.source.getEvent(name)
    }

    return this.events[name]
  }

  handlers(needle) {
    if (this.source) {
      return this.source.handlers(needle)
    }

    return this.store.get(needle)
  }

  _hookHandler(handler, mode) {
    if (this.source) {
      return this.source._hookHandler(handler, mode)
    }

    handler.store = this.store

    if (mode === 'start') {
      return this.store.prepend(handler)
    } else if (mode === 'end') {
      return this.store.append(handler)
    } else {
      return this.store.add(handler)
    }
  }

  _hook(eventName, fn, mode, after) {
    // Do not delegate to the source because this method creates an owner-bound
    // handler and then passes it to #_hookHandler(), which does the delegation

    if (!fn && typeof eventName === 'function') {
      fn = eventName
      eventName = '**'
    } else if (typeof eventName !== 'string') {
      throw new TypeError('An event name must be a string')
    }

    if (typeof fn !== 'function') {
      throw new TypeError('Fn must be a function')
    }

    let handler = Routine(this, fn, after)

    handler.key = eventName
    handler.unhook = unhook

    return this._hookHandler(handler, mode)
  }

  hook(eventName, fn) {
    return this._hook(eventName, fn)
  }

  hookStart(eventName, fn) {
    return this._hook(eventName, fn, 'start')
  }

  hookEnd(eventName, fn) {
    return this._hook(eventName, fn, 'end')
  }

  hookAfter(eventName, fn) {
    return this._hook(eventName, fn, null, true)
  }

  hookStartAfter(eventName, fn) {
    return this._hook(eventName, fn, 'start', true)
  }

  hookEndAfter(eventName, fn) {
    return this._hook(eventName, fn, 'end', true)
  }

  unhook(handler) {
    if (this.source) {
      return this.source.unhook(handler)
    }

    this.store.del(handler)
  }

  next(event) {
    if (this.source) {
      return this.source.next(event)
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
    // Do not delegate to the source because this method creates an owner-bound
    // event and then passes it to #next(), which does the delegation

    let userEvent

    if (eventName && typeof eventName === 'object') {
      userEvent = eventName
      eventName = userEvent.name
    }

    if (typeof eventName !== 'string' || !eventName.length) {
      throw new Error('An event name must be a non-empty string')
    }

    let registeredEvent = this.getEvent(eventName)
    let { mode } = registeredEvent || {}
    let event = createEvent(this.owner, eventName, mode, args, cb)

    if (userEvent) {
      Object.assign(event, userEvent)
    }

    return this.next(event)
  }

  toot(event, ...args) {
    return this._toot(event, args)
  }

  tootWith(eventName, cb, ...args) {
    return this._toot(eventName, args, cb)
  }
}

module.exports = Hooter
