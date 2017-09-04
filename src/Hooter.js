const corrie = require('corrie')
const HandlerStore = require('./Store')
const HooterBase = require('./HooterBase')
const HooterProxy = require('./HooterProxy')
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

class Hooter extends HooterBase {
  constructor(settings) {
    super()

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

  proxy() {
    return new HooterProxy(this)
  }

  getEvent(name) {
    return this.events[name]
  }

  handlers(needle) {
    return this.store.get(needle)
  }

  register(name, mode) {
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

  _hookHandler(handler, priority) {
    handler.store = this.store

    if (priority === 'start') {
      return this.store.prepend(handler)
    } else if (priority === 'end') {
      return this.store.append(handler)
    } else {
      return this.store.add(handler)
    }
  }

  unhook(handler) {
    this.store.del(handler)
  }

  _tootEvent(event) {
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
}

module.exports = Hooter
