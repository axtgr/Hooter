import { ExecutionMode } from 'corrie'
import HooterBase, { Handler, Priority } from './HooterBase'
import Hooter from './Hooter'
import { Event, UserEvent, RegisteredEvent, Events } from 'src/events'

const NO_SOURCE_ERROR =
  "This hooter proxy doesn't have a source assigned, which is required"

interface Settings {
  disallowedEvents?: string[]
  registeredEventsOnly?: boolean
}

class HooterProxy<E extends Events> extends HooterBase<E> {
  disallowedEvents: string[] = []
  owner: any

  constructor(public source: HooterBase<E>, settings?: Settings) {
    super()
    this.corrie = this.source.corrie
    this.registeredEventsOnly = this.source.registeredEventsOnly

    if (!settings) {
      return
    }

    if (settings.disallowedEvents) {
      this.disallowedEvents.push(...settings.disallowedEvents)
    }

    if (typeof settings.registeredEventsOnly !== 'undefined') {
      this.registeredEventsOnly = !!settings.registeredEventsOnly
    }
  }

  getEvent(name: string) {
    if (this.source) {
      return this.source.getEvent(name)
    }

    throw new Error()
  }

  handlers(needle: Handler<E, keyof E> | string) {
    if (this.source) {
      return this.source.handlers(needle)
    }

    throw new Error(NO_SOURCE_ERROR)
  }

  unhook(handler: Handler<E, keyof E> | string) {
    if (this.source) {
      return this.source.unhook(handler)
    }

    throw new Error(NO_SOURCE_ERROR)
  }

  _hookHandler(handler: Handler<E, keyof E>) {
    if (this.source) {
      return this.source._hookHandler(handler)
    }

    throw new Error(NO_SOURCE_ERROR)
  }

  protected _createEvent(
    name: string | UserEvent,
    args: any[],
    cb?: Function
  ): Event {
    let event: Event = super._createEvent(name, args, cb)
    event.tooter = this.owner
    return event
  }

  _tootEvent(event: Event): any {
    if (this.disallowedEvents.includes(event.name)) {
      throw new Error(`Event "${event.name}" cannot be tooted via this Hooter`)
    }

    if (this.source) {
      return this.source._tootEvent(event)
    }

    throw new Error(NO_SOURCE_ERROR)
  }
}

export { Settings, HooterProxy as default, RegisteredEvent }
