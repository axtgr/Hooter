import { ExecutionMode } from 'corrie'


export interface Event {
  name: string
  mode: ExecutionMode
  args: any[]
  tooter?: any
  cb?: Function
}

export interface UserEvent {
  mode: void
  [key: string]: any
}

export interface RegisteredEvent {
  mode: ExecutionMode
}

export function isUserEvent(obj: any): obj is UserEvent {
  return obj && typeof obj === 'object' && !obj.mode
}
