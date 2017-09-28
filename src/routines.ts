import HooterBase from './HooterBase'
import HooterProxy from './HooterProxy'
import { Events } from './events'

const GENERATOR_PROTO = Object.getPrototypeOf(function*(): any {})

const enum Mode {
  Default = 'default',
  Pre = 'pre',
  Post = 'post',
  Result = 'result',
}

interface Routine<T extends Events> {
  (...args: any[]): any
  hooter: HooterBase<T>
  owner?: any
  fn?: Function
}

interface ResultRoutine<T extends Events> extends Routine<T> {
  value: any
}

function createResultRoutine<T extends Events>(
  hooter: HooterBase<T>
): ResultRoutine<T> {
  let routine = function* observableResult(...args: any[]): any {
    let value: any = yield { effect: 'next', args }
    ;(routine as ResultRoutine<T>).value = value
    return value
  } as ResultRoutine<T>
  routine.hooter = hooter
  routine.owner = (hooter as HooterProxy<T>).owner

  return routine
}

function createRoutine<T extends Events>(
  hooter: HooterBase<T>,
  mode: Mode,
  fn?: Function
): Routine<T> {
  if (mode === Mode.Result) {
    return createResultRoutine<T>(hooter)
  }

  if (typeof fn !== 'function') {
    throw new Error('"fn" must be a function')
  }

  let isGenerator = GENERATOR_PROTO.isPrototypeOf(fn)
  let routine: Routine<T>

  if (mode === Mode.Pre) {
    if (isGenerator) {
      routine = function*(...args: any[]): any {
        args = yield* fn.apply(this, args)
        return yield { effect: 'next', args }
      } as Routine<T>
    } else {
      routine = function*(...args: any[]): any {
        args = yield fn.apply(this, args)
        return yield { effect: 'next', args }
      } as Routine<T>
    }
  } else if (mode === Mode.Post) {
    if (isGenerator) {
      routine = function*(...args: any[]): any {
        let result = yield { effect: 'next', args }
        return yield* fn.call(this, result)
      } as Routine<T>
    } else {
      routine = function*(...args: any[]): any {
        let result = yield { effect: 'next', args }
        return fn.call(this, result)
      } as Routine<T>
    }
  } else {
    if (isGenerator) {
      routine = function*(): any {
        return yield* fn.apply(this, arguments)
      } as Routine<T>
    } else {
      routine = function(): any {
        return fn.apply(this, arguments)
      } as Routine<T>
    }
  }

  routine.hooter = hooter
  routine.owner = (hooter as HooterProxy<T>).owner
  routine.fn = fn

  return routine
}

export { Mode, Routine, ResultRoutine, createRoutine }
