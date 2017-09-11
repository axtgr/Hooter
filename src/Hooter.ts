import corrie = require('corrie')
import {
  ExecutionMode, DEFAULT_SETTINGS, Settings as CorrieSettings
} from 'corrie'
import HandlerStore from './Store'
import HooterBase, { Priority, Handler } from './HooterBase'
import HooterProxy from './HooterProxy'
import { RegisteredEvent, Event } from './events'
import {
  throwHandler,
  tootHandler,
  hookHandler,
  forkHandler,
} from './effects'


type Settings = CorrieSettings

interface RegisteredEvents {
  [key: string]: RegisteredEvent
}

interface State {
  hooter: Hooter
}

const EFFECTS = {
  throw: throwHandler,
  toot: tootHandler,
  hook: hookHandler,
  fork: forkHandler,
}

class Hooter extends HooterBase {
  private events: RegisteredEvents = {}
  private store: HandlerStore
  private settings: Settings

  constructor(userSettings?: Settings) {
    super()

    let effectHandlers = Object.assign({}, DEFAULT_SETTINGS.effectHandlers, EFFECTS)
    let state: State
    let settings: CorrieSettings

    if (userSettings && userSettings.state) {
      state = Object.assign({}, userSettings.state, { hooter: this })
    } else {
      state = { hooter: this }
    }

    if (userSettings && userSettings.effectHandlers) {
      effectHandlers = Object.assign(effectHandlers, userSettings.effectHandlers)
    }

    settings = Object.assign({}, DEFAULT_SETTINGS, userSettings, { effectHandlers, state })

    this.settings = settings
    this.corrie = corrie(settings)
    this.store = new HandlerStore(this.matchHandler)
  }

  proxy(): HooterProxy {
    return new HooterProxy(this)
  }

  getEvent(name: string) {
    return this.events[name]
  }

  handlers(needle: Handler | string) {
    return this.store.get(needle)
  }

  register(name: string, mode: ExecutionMode) {
    if (typeof name !== 'string' || !name.length) {
      throw new Error('An event name must be a non-empty string')
    }

    if (this.events[name]) {
      throw new Error(`Event "${name}" is already registered`)
    }

    // if (!MODES.includes(mode)) {
    //   throw new Error(
    //     `An event mode must be one of the following: ${MODES_STRING}`
    //   )
    // }

    this.events[name] = { mode }
  }

  _hookHandler(handler: Handler, priority: Priority) {
    if (priority === Priority.Start) {
      return this.store.prepend(handler)
    } else if (priority === Priority.End) {
      return this.store.append(handler)
    } else {
      return this.store.add(handler)
    }
  }

  unhook(handler: Handler) {
    this.store.del(handler)
  }

  _tootEvent(event: Event) {
    let handlers = this.handlers(event.name)

    if (event.cb) {
      handlers.push(event.cb)
    }

    if (handlers.length === 0) {
      return
    } else if (event.mode === ExecutionMode.Auto) {
      return this.corrie(...handlers).apply(event, event.args)
    } else {
      return (<any>this.corrie)[event.mode](...handlers).apply(event, event.args)
    }
  }
}

export { Settings, Hooter as default }
