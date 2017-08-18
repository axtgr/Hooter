const GENERATOR_PROTO = Object.getPrototypeOf(function* () {})

module.exports = function Routine(hooter, fn) {
  if (!hooter) {
    throw new Error('A hooter is required')
  }

  if (typeof fn !== 'function') {
    throw new Error('fn must be a function')
  }

  let routine

  if (GENERATOR_PROTO.isPrototypeOf(fn)) {
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
