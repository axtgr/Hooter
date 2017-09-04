const wildcardMatch = require('wildcard-match')
const Routine = require('./Routine')


const MODES = ['auto', 'asIs', 'sync', 'async']
const MODES_STRING = MODES.join(', ')
const DEFAULT_MODE = 'auto'

function match(a, b) {
  return wildcardMatch('.', a, b)
}

class HooterBase {
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

  bind(owner) {
    // proxy() is implemented in the subclasses to avoid circular deps
    let proxy = this.proxy()
    proxy.owner = owner
    return proxy
  }

  _createHandler(eventName, fn, routineType) {
    if (!fn && typeof eventName === 'function') {
      fn = eventName
      eventName = '**'
    } else if (typeof eventName !== 'string') {
      throw new TypeError('An event name must be a string')
    }

    let handler = Routine(this, fn, routineType)

    handler.key = eventName
    handler.unhook = () => this.unhook(handler)

    return handler
  }

  _hook(event, fn, priority, type) {
    let handler = this._createHandler(event, fn, type)
    this._hookHandler(handler, priority)
    return handler
  }

  hook(event, fn) {
    return this._hook(event, fn)
  }

  hookStart(event, fn) {
    return this._hook(event, fn, 'start')
  }

  hookEnd(event, fn) {
    return this._hook(event, fn, 'end')
  }

  hookAfter(event, fn) {
    return this._hook(event, fn, null, 'after')
  }

  hookStartAfter(event, fn) {
    return this._hook(event, fn, 'start', 'after')
  }

  hookEndAfter(event, fn) {
    return this._hook(event, fn, 'end', 'after')
  }

  hookResult(event) {
    return this._hook(event, null, null, 'observe')
  }

  hookStartResult(event) {
    return this._hook(event, null, 'start', 'observe')
  }

  hookEndResult(event) {
    return this._hook(event, null, 'end', 'observe')
  }

  _createEvent(name, args, cb) {
    let userEvent

    if (name && typeof name === 'object') {
      userEvent = name
      name = userEvent.name
    }

    if (typeof name !== 'string' || !name.length) {
      throw new Error('An event name must be a non-empty string')
    }

    let registeredEvent = this.getEvent(name)
    let mode = registeredEvent ? registeredEvent.mode : DEFAULT_MODE

    if (!MODES.includes(mode)) {
      throw new Error(
        `An event mode must be one of the following: ${MODES_STRING}`
      )
    }

    let event = {
      name,
      mode,
      args: args || [],
    }

    if (this.owner) {
      event.tooter = this.owner
    }

    if (cb) {
      event.cb = cb
    }

    // FIX: user mode overwrites the registered mode
    if (userEvent) {
      Object.assign(event, userEvent)
    }

    return event
  }

  _toot(event, args, cb) {
    event = this._createEvent(event, args, cb)
    return this._tootEvent(event)
  }

  toot(event, ...args) {
    return this._toot(event, args)
  }

  tootWith(event, cb, ...args) {
    return this._toot(event, args, cb)
  }
}

module.exports = HooterBase
