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
import { Item as StoreItem } from './Store'

const enum Priority {
  Start = 'start',
  Normal = 'normal',
  End = 'end',
}

interface HandlerProperties<E extends Events, K extends keyof E>
  extends StoreItem {
  event: K
}

interface Handler<E extends Events, K extends keyof E>
  extends HandlerProperties<E, K> {
  (...args: any[]): any
  unhook: () => void
}

function match(a: string, b: string) {
  return wildcardMatch('.', a, b)
}

const DEFAULT_EXECUTION_MODE = ExecutionMode.Auto

abstract class HooterBase<E extends Events> {
  registeredEventsOnly = false
  corrie: typeof corrie

  match(a: string, b: string) {
    return match(a, b)
  }

  matchHandler(
    handler: Handler<E, keyof E>,
    needle?: Handler<E, keyof E> | string
  ) {
    if (typeof needle === 'undefined') {
      return true
    }

    if (typeof needle === 'string') {
      return match(handler.event, needle)
    }

    return handler === needle
  }

  wrap(fn: Function) {
    let routine = createRoutine<E>(this, RoutineMode.Default, fn)
    return this.corrie(routine)
  }

  abstract handlers(needle: Handler<E, keyof E> | string): Handler<E, keyof E>[]

  abstract unhook(handler: Handler<E, keyof E> | string): void

  private _createHandler<K extends keyof E>(
    routineMode: RoutineMode,
    event: K | HandlerProperties<E, K>,
    fn?: E[K]
  ): Handler<E, K> & Routine<E> {
    let handler = createRoutine(this, routineMode, fn) as Handler<E, K> &
      Routine<E>
    let tags = []

    if (handler.owner && handler.owner.name) {
      tags.push('owner:' + handler.owner.name)
    }

    if (typeof event === 'string') {
      handler.event = event
    } else if (typeof event === 'object' && typeof event.event === 'string') {
      handler.event = event.event
      handler.goesBefore = event.goesBefore
      handler.goesAfter = event.goesAfter
      event.tags && tags.push(...event.tags)
    } else {
      throw new Error(
        'An event must be a string or an object with an event property'
      )
    }

    tags.push('event:' + handler.event)
    handler.tags = tags
    handler.unhook = () => this.unhook(handler)
    return handler
  }

  abstract _hookHandler(handler: Handler<E, keyof E>): void

  hookGeneric<K extends keyof E>(
    routineMode: RoutineMode,
    priority: Priority | undefined,
    event: K | HandlerProperties<E, K>,
    fn?: E[K]
  ) {
    let handler = this._createHandler(routineMode, event, fn)
    let eventTag = 'event:' + handler.event

    if (priority === Priority.Start) {
      handler.goesBefore = handler.goesBefore
        ? [eventTag].concat(handler.goesBefore)
        : [eventTag]
    } else if (priority === Priority.End) {
      handler.goesAfter = handler.goesAfter
        ? [eventTag].concat(handler.goesAfter)
        : [eventTag]
    }

    this._hookHandler(handler)
    return handler
  }

  hook<K extends keyof E>(event: K | HandlerProperties<E, K>, fn?: E[K]) {
    let mode = fn ? RoutineMode.Default : RoutineMode.Result
    return this.hookGeneric(mode, Priority.Normal, event, fn)
  }

  hookStart<K extends keyof E>(event: K | HandlerProperties<E, K>, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Default, Priority.Start, event, fn)
  }

  hookEnd<K extends keyof E>(event: K | HandlerProperties<E, K>, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Default, Priority.End, event, fn)
  }

  preHook<K extends keyof E>(event: K | HandlerProperties<E, K>, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Pre, Priority.Normal, event, fn)
  }

  preHookStart<K extends keyof E>(
    event: K | HandlerProperties<E, K>,
    fn: E[K]
  ) {
    return this.hookGeneric(RoutineMode.Pre, Priority.Start, event, fn)
  }

  preHookEnd<K extends keyof E>(event: K | HandlerProperties<E, K>, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Pre, Priority.End, event, fn)
  }

  postHook<K extends keyof E>(event: K | HandlerProperties<E, K>, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Post, Priority.Normal, event, fn)
  }

  postHookStart<K extends keyof E>(
    event: K | HandlerProperties<E, K>,
    fn: E[K]
  ) {
    return this.hookGeneric(RoutineMode.Post, Priority.Start, event, fn)
  }

  postHookEnd<K extends keyof E>(event: K | HandlerProperties<E, K>, fn: E[K]) {
    return this.hookGeneric(RoutineMode.Post, Priority.End, event, fn)
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

    if (!registeredEvent && this.registeredEventsOnly) {
      throw new Error(
        `Cannot toot "${name}": only registered events are allowed`
      )
    }

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

export {
  Priority,
  StoreItem,
  HandlerProperties,
  Handler,
  HooterBase as default,
}
