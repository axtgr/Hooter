const Routine = require('./Routine')
const { handler: corrieForkHandler } = require('corrie/src/effects/fork')


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
  let hooter = execution.routine.hooter

  if (!hooter) {
    throw new Error('Routine hooter is undefined')
  }

  return hooter._toot(event, args, cb)
}

function toot(event, ...args) {
  return { effect: 'toot', event, args }
}

function tootWith(event, cb, ...args) {
  return { effect: 'toot', event, args, cb }
}

function hookHandler(effect, execution) {
  let { event, mode, fn } = effect
  let hooter = execution.routine.hooter

  if (!hooter) {
    throw new Error('Routine hooter is undefined')
  }

  if (mode === 'start') {
    return hooter.hookStart(event, fn)
  } else if (mode === 'end') {
    return hooter.hookEnd(event, fn)
  } else {
    return hooter.hook(event, fn)
  }
}

function hook(event, fn) {
  return { effect: 'hook', event, fn }
}

function hookStart(event, fn) {
  return { effect: 'hook', event, mode: 'start', fn }
}

function hookEnd(event, fn) {
  return { effect: 'hook', event, mode: 'end', fn }
}

function forkHandler(effect, execution) {
  let { routine, args, mode } = effect

  routine = Routine(execution.routine.hooter, routine)
  effect = { routine, args, mode }

  return corrieForkHandler(effect, execution)
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
  forkHandler,
}
