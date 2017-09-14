import { ExecutionMode } from 'corrie'

interface Event {
  name: string
  mode: ExecutionMode
  args: any[]
  tooter?: any
  cb?: Function
}

interface UserEvent {
  mode: void
  [key: string]: any
}

interface RegisteredEvent {
  mode: ExecutionMode
}

interface Events {
  [key: string]: Function
}

type RegisteredEvents<T extends Events> = { [K in keyof T]: RegisteredEvent }

function isUserEvent(obj: any): obj is UserEvent {
  return obj && typeof obj === 'object' && !obj.mode
}

export {
  Event,
  UserEvent,
  RegisteredEvent,
  Events,
  RegisteredEvents,
  isUserEvent,
}
