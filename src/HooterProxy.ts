import { ExecutionMode } from 'corrie';
import HooterBase, { Handler, Priority } from './HooterBase'
import Hooter from './Hooter'
import { Event, UserEvent, RegisteredEvent } from 'src/events';


class HooterProxy extends HooterBase {
  owner: any

  constructor(public source: HooterBase) {
    super()
    this.corrie = this.source.corrie
  }

  proxy(): HooterProxy {
    return new HooterProxy(this)
  }

  getEvent(name: string) {
    if (this.source) {
      return this.source.getEvent(name)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  handlers(needle: Handler | string) {
    if (this.source) {
      return this.source.handlers(needle)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  register(name: string, mode: ExecutionMode) {
    if (this.source) {
      return this.source.register(name, mode)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  unhook(handler: Handler) {
    if (this.source) {
      return this.source.unhook(handler)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  _hookHandler(handler: Handler, priority: Priority) {
    if (this.source) {
      return this.source._hookHandler(handler, priority)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  protected _createEvent(name: string | UserEvent, args: any[], cb?: Function): Event {
    let event: Event = super._createEvent(name, args, cb)
    event.tooter = this.owner
    return event
  }

  _tootEvent(event: Event): any {
    if (this.source) {
      return this.source._tootEvent(event)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }
}

export { HooterProxy as default, RegisteredEvent }
