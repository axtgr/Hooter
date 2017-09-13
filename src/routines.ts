import HooterBase from './HooterBase'
import HooterProxy from './HooterProxy'
import { Events } from './events'


const GENERATOR_PROTO = Object.getPrototypeOf(function* (): any {})


const enum Mode {
  Default = 'default',
  After = 'after',
  Result = 'result'
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


function createResultRoutine<T extends Events>(hooter: HooterBase<T>): ResultRoutine<T> {
  let routine = <ResultRoutine<T>>function* observableResult(...args: any[]): any {
    let value: any = yield { effect: 'next', args };
    (<ResultRoutine<T>>routine).value = value
    return value
  }
  routine.hooter = hooter
  routine.owner = (<HooterProxy<T>>hooter).owner

  return routine
}

function createRoutine<T extends Events>(hooter: HooterBase<T>, mode: Mode, fn?: Function): Routine<T> {
  if (mode === Mode.Result) {
    return createResultRoutine<T>(hooter)
  }

  if (typeof fn !== 'function') {
    throw new Error('"fn" must be a function')
  }


  let after = mode === Mode.After
  let isGenerator = GENERATOR_PROTO.isPrototypeOf(fn)
  let routine: Routine<T>

  if (after && isGenerator) {
    routine = <Routine<T>>function* (...args: any[]): any {
      let result = yield { effect: 'next', args }
      return yield* fn.call(this, result)
    }
  } else if (after) {
    routine = <Routine<T>>function* (...args: any[]): any {
      let result = yield { effect: 'next', args }
      return fn.call(this, result)
    }
  } else if (isGenerator) {
    routine = <Routine<T>>function* (): any {
      return yield* fn.apply(this, arguments)
    }
  } else {
    routine = <Routine<T>>function (): any {
      return fn.apply(this, arguments)
    }
  }

  routine.hooter = hooter
  routine.owner = (<HooterProxy<T>>hooter).owner
  routine.fn = fn

  return routine
}

export { Mode, Routine, ResultRoutine, createRoutine }
