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
  let { event, fn, mode, after } = effect
  let hooter = execution.routine.hooter

  if (!hooter) {
    throw new Error('Routine hooter is undefined')
  }

  return hooter._hook(event, fn, mode, after)
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

function hookAfter(event, fn) {
  return { effect: 'hook', event, after: true, fn }
}

function hookStartAfter(event, fn) {
  return { effect: 'hook', event, mode: 'start', after: true, fn }
}

function hookEndAfter(event, fn) {
  return { effect: 'hook', event, mode: 'end', after: true, fn }
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
  hookAfter,
  hookStartAfter,
  hookEndAfter,
  forkHandler,
}
