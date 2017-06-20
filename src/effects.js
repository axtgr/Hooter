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

function hookHandler(effect, execution) {
  let { args, mode } = effect
  let hooter = execution.state.hooter

  if (mode === 'start') {
    return hooter.hookStart(...args)
  } else if (mode === 'end') {
    return hooter.hookEnd(...args)
  } else {
    return hooter.hook(...args)
  }
}

function hook(...args) {
  return { effect: 'hook', args }
}

function hookStart(...args) {
  return { effect: 'hook', mode: 'start', args }
}

function hookEnd(...args) {
  return { effect: 'hook', mode: 'end', args }
}

module.exports = {
  throwHandler,
  tootHandler,
  toot,
  tootWith,
  hookHandler,
  hook,
  hookStart,
  hookEnd,
}
