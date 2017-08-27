const GENERATOR_PROTO = Object.getPrototypeOf(function* () {})

module.exports = function Routine(hooter, fn, after) {
  if (!hooter) {
    throw new Error('A hooter is required')
  }

  if (typeof fn !== 'function') {
    throw new Error('fn must be a function')
  }

  let isGenerator = GENERATOR_PROTO.isPrototypeOf(fn)
  let routine

  if (after && isGenerator) {
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
