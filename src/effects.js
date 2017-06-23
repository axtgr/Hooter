function throwHandler(effect, execution) {
  let err = effect.err

  if (err instanceof Error && !err.event) {
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
  let { event, mode, handler } = effect
  let hooter = execution.state.hooter

  if (mode === 'start') {
    return hooter.hookStart(event, handler)
  } else if (mode === 'end') {
    return hooter.hookEnd(event, handler)
  } else {
    return hooter.hook(event, handler)
  }
}

function hook(event, handler) {
  return { effect: 'hook', event, handler }
}

function hookStart(event, handler) {
  return { effect: 'hook', event, mode: 'start', handler }
}

function hookEnd(event, handler) {
  return { effect: 'hook', event, mode: 'end', handler }
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
