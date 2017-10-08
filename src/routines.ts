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

interface Routine<E extends Events> {
  (...args: any[]): any
  hooter: HooterBase<E>
  owner?: any
  fn?: Function
}

interface ResultRoutine<E extends Events> extends Routine<E> {
  value: any
}

function createResultRoutine<E extends Events>(
  hooter: HooterBase<E>
): ResultRoutine<E> {
  let routine = function* observableResult(...args: any[]): any {
    let value: any = yield { effect: 'next', args }
    ;(routine as ResultRoutine<E>).value = value
    return value
  } as ResultRoutine<E>
  routine.hooter = hooter
  routine.owner = (hooter as HooterProxy<E>).owner

  return routine
}

function createRoutine<E extends Events>(
  hooter: HooterBase<E>,
  mode: Mode,
  fn?: Function
): Routine<E> {
  if (mode === Mode.Result) {
    return createResultRoutine<E>(hooter)
  }

  if (typeof fn !== 'function') {
    throw new Error('"fn" must be a function')
  }

  let isGenerator = GENERATOR_PROTO.isPrototypeOf(fn)
  let routine: Routine<E>

  if (mode === Mode.Pre) {
    if (isGenerator) {
      routine = function* unnamedRoutine(...args: any[]): any {
        let newArgs = yield* fn.apply(this, args)
        args = typeof newArgs === 'undefined' ? args : newArgs
        return yield { effect: 'next', args }
      } as Routine<E>
    } else {
      routine = function* unnamedRoutine(...args: any[]): any {
        let newArgs = yield fn.apply(this, args)
        args = typeof newArgs === 'undefined' ? args : newArgs
        return yield { effect: 'next', args }
      } as Routine<E>
    }
  } else if (mode === Mode.Post) {
    if (isGenerator) {
      routine = function* unnamedRoutine(...args: any[]): any {
        let result = yield { effect: 'next', args }
        return yield* fn.call(this, result)
      } as Routine<E>
    } else {
      routine = function* unnamedRoutine(...args: any[]): any {
        let result = yield { effect: 'next', args }
        return fn.call(this, result)
      } as Routine<E>
    }
  } else {
    if (isGenerator) {
      routine = function* unnamedRoutine(): any {
        return yield* fn.apply(this, arguments)
      } as Routine<E>
    } else {
      routine = function unnamedRoutine(): any {
        return fn.apply(this, arguments)
      } as Routine<E>
    }
  }

  routine.hooter = hooter
  routine.owner = (hooter as HooterProxy<E>).owner
  routine.fn = fn

  let ownerName = routine.owner && routine.owner.name
  let name = fn.name

  if (ownerName) {
    name = name ? `${ownerName}: ${name}` : `${ownerName}: unnamedRoutine`
  }

  if (name) {
    Object.defineProperty(routine, 'name', {
      value: name,
      writable: true,
    })
  }

  return routine
}

export { Mode, Routine, ResultRoutine, createRoutine }
