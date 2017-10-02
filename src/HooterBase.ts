import wildcardMatch = require('wildcard-match')
import corrie = require('corrie')
import { ExecutionMode } from 'corrie'
import HooterProxy from './HooterProxy'
import {
  Event,
  UserEvent,
  RegisteredEvent,
  Events,
  isUserEvent,
} from './events'
import {
  Routine,
  ResultRoutine,
  createRoutine,
  Mode as RoutineMode,
} from './routines'

const enum Priority {
  Start = 'start',
  Normal = 'normal',
  End = 'end',
}

interface Handler extends Function {
  key: string
  unhook: () => void
}

function match(a: string, b: string) {
  return wildcardMatch('.', a, b)
}

const DEFAULT_EXECUTION_MODE = ExecutionMode.Auto

abstract class HooterBase<E extends Events> {
  corrie: typeof corrie

  match(a: string, b: string) {
    return match(a, b)
  }

  matchHandler(handler: Handler, needle: Handler | string) {
    if (typeof needle === 'string') {
      return match(handler.key, needle)
    }

    return handler === needle
  }

  wrap(fn: Function) {
    let routine = createRoutine<E>(this, RoutineMode.Default, fn)
    return this.corrie(routine)
  }

  abstract proxy(): HooterProxy<E>

  bind(owner: any) {
    let proxy = this.proxy()
    proxy.owner = owner
    return proxy
  }

  plug(plugin: Function): Function
  plug(plugin: Function[]): Function[]
  plug(plugin: Function[] | Function) {
    if (Array.isArray(plugin)) {
      return plugin.map(p => this.plug(p))
    }

    let proxy = this.bind(plugin)
    let wrappedPlugin = proxy.wrap(plugin)
    return wrappedPlugin.bind(proxy)
  }

  abstract handlers(needle: Handler | string): Handler[]

  abstract unhook(handler: Handler): void

  private _createHandler(
    routineMode: RoutineMode,
    event: string,
    fn?: Function
  ): Handler & Routine<E> {
    let handler = createRoutine(this, routineMode, fn) as Handler & Routine<E>
    handler.key = event
    handler.unhook = () => this.unhook(handler)
    return handler
  }

  abstract _hookHandler(handler: Handler, priority: Priority): void

  hookGeneric<K extends keyof E>(
    routineMode: RoutineMode,
    priority: Priority,
    event: K,
    fn?: E[K]
  ) {
    let handler = this._createHandler(routineMode, event, fn)
    this._hookHandler(handler, priority)
    return handler
  }

  hook<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Default, Priority.Normal, event, fn)
  }

  hookStart<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Default, Priority.Start, event, fn)
  }

  hookEnd<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Default, Priority.End, event, fn)
  }

  preHook<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Pre, Priority.Normal, event, fn)
  }

  preHookStart<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Pre, Priority.Start, event, fn)
  }

  preHookEnd<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Pre, Priority.End, event, fn)
  }

  postHook<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Post, Priority.Normal, event, fn)
  }

  postHookStart<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Post, Priority.Start, event, fn)
  }

  postHookEnd<K extends keyof E>(event: K, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Post, Priority.End, event, fn)
  }

  hookResult<K extends keyof E>(event: K) {
    return this.hookGeneric(
      RoutineMode.Result,
      Priority.Normal,
      event
    ) as Handler & ResultRoutine<E>
  }

  abstract getEvent(name: string): RegisteredEvent | undefined

  protected _createEvent(
    name: string | UserEvent,
    args: any[],
    cb?: Function
  ): Event {
    let userEvent: UserEvent | undefined

    if (isUserEvent(name)) {
      userEvent = name
      name = userEvent.name
    }

    if (typeof name !== 'string' || !name.length) {
      throw new Error('An event name must be a non-empty string')
    }

    let registeredEvent: RegisteredEvent | undefined = this.getEvent(name)
    let mode: ExecutionMode = registeredEvent
      ? registeredEvent.mode
      : DEFAULT_EXECUTION_MODE

    let event: Event = {
      name,
      mode,
      args: args || [],
    }

    if (cb) {
      event.cb = cb
    }

    if (userEvent) {
      Object.assign(event, userEvent)
    }

    return event
  }

  abstract _tootEvent(event: Event): any

  tootGeneric<K extends keyof E>(
    userEvent: K | UserEvent,
    args: any[],
    cb?: Function
  ): any {
    let event: Event = this._createEvent(userEvent, args, cb)
    return this._tootEvent(event)
  }

  toot<K extends keyof E>(event: K | UserEvent, ...args: any[]): any {
    return this.tootGeneric(event, args)
  }

  tootWith<K extends keyof E>(
    event: K | UserEvent,
    cb: Function,
    ...args: any[]
  ): any {
    return this.tootGeneric(event, args, cb)
  }
}

export { Priority, Handler, HooterBase as default }
