function tootHandler(effect, execution) {
  let { event, args, cb } = effect
  let hooter = execution.state.hooter
  return hooter._toot(event, args, cb)
}

function toot(event, ...args) {
  return { effect: 'toot', event, args }
}

function tootWith(event, cb, ...args) {
  return { effect: 'toot', event, args, cb }
}

module.exports = {
  tootHandler,
  toot,
  tootWith,
}
