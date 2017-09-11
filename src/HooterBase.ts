import wildcardMatch = require('wildcard-match')
import corrie = require('corrie')
import { ExecutionMode } from 'corrie'
import HooterProxy from './HooterProxy'
import { Event, UserEvent, RegisteredEvent, isUserEvent } from './events'
import { Routine, ResultRoutine, createRoutine, Mode as RoutineMode } from './routines'


const enum Priority {
  Start = 'start',
  Normal = 'normal',
  End = 'end'
}

interface Handler extends Function {
  key: string
  unhook: () => void
}

function match(a: string, b: string) {
  return wildcardMatch('.', a, b)
}

const DEFAULT_EXECUTION_MODE = ExecutionMode.Auto


abstract class HooterBase {
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
    let routine = createRoutine(this, RoutineMode.Default, fn)
    return this.corrie(routine)
  }

  abstract proxy(): HooterProxy

  bind(owner: any) {
    let proxy = this.proxy()
    proxy.owner = owner
    return proxy
  }

  abstract register(name: string, mode: ExecutionMode): void

  abstract handlers(needle: Handler | string): Handler[]

  abstract unhook(handler: Handler): void

  private _createHandler(routineMode: RoutineMode, event: string, fn?: Function): Handler & Routine {
    let handler = <Handler & Routine>createRoutine(this, routineMode, fn)

    handler.key = event
    handler.unhook = () => this.unhook(handler)

    return handler
  }

  abstract _hookHandler(handler: Handler, priority: Priority): void

  hookGeneric(
    routineMode: RoutineMode,
    priority: Priority,
    event: string,
    fn?: Function,
  ) {
    let handler = this._createHandler(routineMode, event, fn)
    this._hookHandler(handler, priority)
    return handler
  }

  hook(event: string, fn: Function) {
    return this.hookGeneric(RoutineMode.Default, Priority.Normal, event, fn)
  }

  hookStart(event: string, fn: Function) {
    return this.hookGeneric(RoutineMode.Default, Priority.Start, event, fn)
  }

  hookEnd(event: string, fn: Function) {
    return this.hookGeneric(RoutineMode.Default, Priority.End, event, fn)
  }

  hookAfter(event: string, fn: Function) {
    return this.hookGeneric(RoutineMode.After, Priority.Normal, event, fn)
  }

  hookStartAfter(event: string, fn: Function) {
    return this.hookGeneric(RoutineMode.After, Priority.Start, event, fn)
  }

  hookEndAfter(event: string, fn: Function) {
    return this.hookGeneric(RoutineMode.After, Priority.End, event, fn)
  }

  hookResult(event: string) {
    return <Handler & ResultRoutine>this.hookGeneric(RoutineMode.Result, Priority.Normal, event)
  }

  hookStartResult(event: string) {
    return <Handler & ResultRoutine>this.hookGeneric(RoutineMode.Result, Priority.Start, event)
  }

  hookEndResult(event: string) {
    return <Handler & ResultRoutine>this.hookGeneric(RoutineMode.Result, Priority.End, event)
  }

  abstract getEvent(name: string): RegisteredEvent

  protected _createEvent(name: string | UserEvent, args: any[], cb?: Function): Event {
    let userEvent: UserEvent | undefined

    if (isUserEvent(name)) {
      userEvent = name
      name = userEvent.name
    }

    if (typeof name !== 'string' || !name.length) {
      throw new Error('An event name must be a non-empty string')
    }

    let registeredEvent: RegisteredEvent | undefined = this.getEvent(name)
    let mode: ExecutionMode = registeredEvent ? registeredEvent.mode : DEFAULT_EXECUTION_MODE

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

  tootGeneric(userEvent: string | UserEvent, args: any[], cb?: Function) {
    let event: Event = this._createEvent(userEvent, args, cb)
    return this._tootEvent(event)
  }

  toot(event: string | UserEvent, ...args: any[]) {
    return this.tootGeneric(event, args)
  }

  tootWith(event: string | UserEvent, cb: Function, ...args: any[]) {
    return this.tootGeneric(event, args, cb)
  }
}

export { Priority, Handler, HooterBase as default }
