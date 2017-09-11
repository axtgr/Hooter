import HooterBase from './HooterBase'
import HooterProxy from './HooterProxy'


const GENERATOR_PROTO = Object.getPrototypeOf(function* (): any {})


const enum Mode {
  Default = 'default',
  After = 'after',
  Result = 'result'
}

interface Routine {
  (...args: any[]): any
  hooter: HooterBase
  owner?: any
  fn?: Function
}

interface ResultRoutine extends Routine {
  value: any
}


function createResultRoutine(hooter: HooterBase): ResultRoutine {
  let routine = <ResultRoutine>function* observableResult(...args: any[]): any {
    let value: any = yield { effect: 'next', args };
    (<ResultRoutine>routine).value = value
    return value
  }
  routine.hooter = hooter
  routine.owner = (<HooterProxy>hooter).owner

  return routine
}

function createRoutine(hooter: HooterBase, mode: Mode, fn?: Function): Routine {
  if (mode === Mode.Result) {
    return createResultRoutine(hooter)
  }

  if (typeof fn !== 'function') {
    throw new Error('"fn" must be a function')
  }


  let after = mode === Mode.After
  let isGenerator = GENERATOR_PROTO.isPrototypeOf(fn)
  let routine: Routine

  if (after && isGenerator) {
    routine = <Routine>function* (...args: any[]): any {
      let result = yield { effect: 'next', args }
      return yield* fn.call(this, result)
    }
  } else if (after) {
    routine = <Routine>function* (...args: any[]): any {
      let result = yield { effect: 'next', args }
      return fn.call(this, result)
    }
  } else if (isGenerator) {
    routine = <Routine>function* (): any {
      return yield* fn.apply(this, arguments)
    }
  } else {
    routine = <Routine>function (): any {
      return fn.apply(this, arguments)
    }
  }

  routine.hooter = hooter
  routine.owner = (<HooterProxy>hooter).owner
  routine.fn = fn

  return routine
}

export { Mode, Routine, ResultRoutine, createRoutine }
