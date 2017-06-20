function throwHandler(effect, execution) {
  let err = effect.err

  if (!err.event) {
    Object.defineProperty(err, 'event', {
      value: execution.context,
      enumerable: false,
    })
  }

  execution.status = 'completed'
  throw err
}

function tootHandler(effect, execution) {
  let { event, args, cb } = effect
  let hooter = execution.state.hooter
  let value = hooter._toot(event, args, cb)
  return { effect: 'resolve', value }
}

function toot(event, ...args) {
  return { effect: 'toot', event, args }
}

function tootWith(event, cb, ...args) {
  return { effect: 'toot', event, args, cb }
}

module.exports = {
  throwHandler,
  tootHandler,
  toot,
  tootWith,
}
