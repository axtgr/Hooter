import corrie = require('corrie')
import {
  ExecutionMode,
  EffectHandlers,
  DEFAULT_SETTINGS,
  Settings as CorrieSettings,
} from 'corrie'
import HandlerStore from './Store'
import HooterBase, { Priority, Handler } from './HooterBase'
import HooterProxy from './HooterProxy'
import { Event, Events, RegisteredEvent, RegisteredEvents } from './events'
import { throwHandler, tootHandler, hookHandler, forkHandler } from './effects'

interface Settings<T extends Events> extends CorrieSettings {
  events?: RegisteredEvents<T>
}

interface State<T extends Events> {
  hooter: Hooter<T>
}

const EFFECTS: EffectHandlers = Object.assign(DEFAULT_SETTINGS.effectHandlers, {
  throw: throwHandler,
  toot: tootHandler,
  hook: hookHandler,
  fork: forkHandler,
})

class Hooter<E extends Events> extends HooterBase<E> {
  private registeredEvents?: RegisteredEvents<E>
  private store: HandlerStore

  events: E = {} as E
  settings: Settings<E>

  constructor(userSettings?: Settings<E>) {
    super()

    let effectHandlers: EffectHandlers = EFFECTS
    let state: State<E> = { hooter: this }
    let settings: Settings<E>

    if (userSettings && userSettings.state) {
      state = Object.assign({}, userSettings.state, state)
    }

    if (userSettings && userSettings.effectHandlers) {
      effectHandlers = Object.assign(
        {},
        effectHandlers,
        userSettings.effectHandlers
      )
    }

    settings = Object.assign({}, DEFAULT_SETTINGS, userSettings, {
      effectHandlers,
      state,
    })

    this.settings = settings
    this.corrie = corrie(settings)
    this.store = new HandlerStore(this.matchHandler)

    if (settings.events) {
      this.registeredEvents = settings.events
      this.assignEventToots(settings.events)
    }
  }

  private assignEventToots(events: RegisteredEvents<E>): void {
    Object.entries(events).forEach(([name, value]) => {
      this.events[name] = (...args: any[]) => {
        return this.tootGeneric(name, args)
      }
    })
  }

  proxy(): HooterProxy<E> {
    return new HooterProxy<E>(this)
  }

  getEvent(name: string): RegisteredEvent | undefined {
    return this.registeredEvents && this.registeredEvents[name]
  }

  handlers(needle: Handler | string) {
    return this.store.get(needle)
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
      return (this.corrie as any)
        [event.mode](...handlers)
        .apply(event, event.args)
    }
  }
}

export { ExecutionMode, Events, RegisteredEvents, Settings, Hooter as default }
