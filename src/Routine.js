const GENERATOR_PROTO = Object.getPrototypeOf(function* () {})

module.exports = function Routine(hooter, fn, type) {
  if (!hooter) {
    throw new Error('A hooter is required')
  }

  let observe = type === 'observe'
  let after = type === 'after'

  if (typeof fn !== 'function' && !observe) {
    throw new Error('fn must be a function')
  }

  let isGenerator = !observe && GENERATOR_PROTO.isPrototypeOf(fn)
  let routine

  if (observe) {
    routine = function* observableResult(...args) {
      let value = yield { effect: 'next', args }
      routine.value = value
      return value
    }
    routine.get = () => routine.value
  } else if (after && isGenerator) {
    routine = function* (...args) {
      let result = yield { effect: 'next', args }
      return yield* fn.call(this, result)
    }
  } else if (after) {
    routine = function* (...args) {
      let result = yield { effect: 'next', args }
      return fn.call(this, result)
    }
  } else if (isGenerator) {
    routine = function* () {
      return yield* fn.apply(this, arguments)
    }
  } else {
    routine = function() {
      return fn.apply(this, arguments)
    }
  }

  routine.hooter = hooter
  routine.owner = hooter.owner
  routine.fn = fn

  return routine
}
