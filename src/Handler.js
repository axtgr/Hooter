const GENERATOR_PROTO = Object.getPrototypeOf(function* () {})

function unhook() {
  this.store.del(this)
}

module.exports = function Handler(store, key, fn) {
  if (!store || typeof store.del !== 'function') {
    throw new Error('A store with a del method is required')
  }

  if (typeof fn !== 'function') {
    throw new Error('fn must be a function')
  }

  let handler

  if (GENERATOR_PROTO.isPrototypeOf(fn)) {
    handler = function* () {
      return yield* fn.apply(this, arguments)
    }
  } else {
    handler = function() {
      return fn.apply(this, arguments)
    }
  }

  handler.store = store
  handler.key = key
  handler.fn = fn
  handler.unhook = unhook

  return handler
}
