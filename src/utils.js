const wildcardMatch = require('wildcard-match')


function createEvent(tooter, name, mode, args, cb) {
  args = args || []
  mode = mode || 'auto'

  let event = { name, mode, args }

  if (tooter) {
    event.tooter = tooter
  }

  if (cb) {
    event.cb = cb
  }

  return event
}

function match(a, b) {
  return wildcardMatch('.', a, b)
}

function unhook() {
  if (!this.hooter) {
    throw new Error('A hooter is not defined on the routine')
  }

  this.hooter.unhook(this)
}

module.exports = { createEvent, match, unhook }
