import corrie = require('corrie')
import {
  ExecutionMode,
  EffectHandlers,
  DEFAULT_SETTINGS,
  Settings as CorrieSettings,
} from 'corrie'
import HandlerStore from './Store'
import HooterBase, { Priority, Handler } from './HooterBase'
import HooterProxy, { Settings as HooterProxySettings } from './HooterProxy'
import { Event, Events, RegisteredEvent, RegisteredEvents } from './events'
import { throwHandler, tootHandler, hookHandler, forkHandler } from './effects'

interface Settings<T extends Events> extends CorrieSettings {
  events?: RegisteredEvents<T>
  registeredEventsOnly?: boolean
}

interface State<T extends Events> {
  hooter: Hooter<T>
}

type Plugin = (...args: any[]) => void

interface WrappedPlugin {
  (): void
  raw: Plugin
}

interface PluginSettings extends HooterProxySettings {
  required: boolean
}

const EFFECTS: EffectHandlers = Object.assign(DEFAULT_SETTINGS.effectHandlers, {
  throw: throwHandler,
  toot: tootHandler,
  hook: hookHandler,
  fork: forkHandler,
})

class Hooter<E extends Events> extends HooterBase<E> {
  private store: HandlerStore<Handler<E, keyof E>>
  private plugins: WrappedPlugin[] = []
  private requiredPlugins: string[] = []
  private disabledPlugins: string[] = []
  private registeredEvents?: RegisteredEvents<E>
  private cache: { [key: string]: Function }

  started = false
  events: E = {} as E
  settings: Settings<E>

  constructor(userSettings?: Settings<E>) {
    super()
    this.flushCache()

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
    this.registeredEventsOnly = !!settings.registeredEventsOnly

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

  private flushCache() {
    this.cache = Object.create(null)
  }

  proxy(settings?: HooterProxySettings): HooterProxy<E> {
    return new HooterProxy<E>(this, settings)
  }

  bind(owner: any, settings?: HooterProxySettings) {
    let proxy = this.proxy(settings)
    proxy.owner = owner
    return proxy
  }

  plug(
    plugin: Plugin | string | (Plugin | string)[],
    settings?: PluginSettings
  ): void {
    if (this.started) {
      throw new Error('Cannot add a plugin to an already started Hooter')
    }

    if (Array.isArray(plugin)) {
      return plugin.forEach(p => this.plug(p, settings))
    }

    if (typeof plugin === 'string') {
      if (plugin[0] !== '-') {
        throw new Error(
          'When a string is provided as a plugin, it must start with a hyphen'
        )
      }
      this.disabledPlugins.push(plugin.slice(1))
      return
    }

    if (typeof plugin !== 'function') {
      throw new Error('A plugin must be a function')
    }

    let proxy = this.bind(plugin, settings)
    let wrappedPlugin: WrappedPlugin = proxy.wrap(plugin).bind(proxy)
    wrappedPlugin.raw = plugin
    this.plugins.push(wrappedPlugin)

    if (settings && settings.required) {
      this.requiredPlugins.push(plugin.name)
    }
  }

  start(...args: any[]) {
    if (this.started) {
      throw new Error('Cannot start an already started Hooter')
    }

    this.started = true

    let plugins = this.plugins.filter(plugin => {
      let { name } = plugin.raw
      let isDisabled = this.disabledPlugins.includes(name)
      let isRequired = this.requiredPlugins.includes(name)

      if (isDisabled && isRequired) {
        throw new Error(`Plugin "${name}" is required and cannot be disabled`)
      }

      return !isDisabled
    })

    plugins.forEach(plugin => plugin(...args))
  }

  getEvent(name: string): RegisteredEvent | undefined {
    return this.registeredEvents && this.registeredEvents[name]
  }

  handlers(needle: Handler<E, keyof E> | string) {
    return this.store.get(needle)
  }

  _hookHandler(handler: Handler<E, keyof E>) {
    this.flushCache()
    return this.store.add(handler)
  }

  unhook(needle: Handler<E, keyof E> | string) {
    this.flushCache()
    this.store.del(needle)
  }

  _tootEvent(event: Event) {
    let { cache } = this

    if (!event.cb && this.cache[event.name]) {
      return this.cache[event.name].apply(event, event.args)
    }

    let handlers: Function[] = this.handlers(event.name)

    if (event.cb) {
      handlers.push(event.cb)
    }

    let execution

    if (handlers.length === 0) {
      return
    } else if (event.mode === ExecutionMode.Auto) {
      execution = this.corrie(...handlers)
    } else {
      execution = (this.corrie as any)[event.mode](...handlers)
    }

    if (!event.cb) {
      this.cache[event.name] = execution
    }

    return execution.apply(event, event.args)
  }
}

export {
  ExecutionMode,
  Events,
  RegisteredEvents,
  Settings,
  PluginSettings,
  Plugin,
  WrappedPlugin,
  Hooter as default,
}
