const corrieEffects = require('corrie/effects')
const {
  toot,
  tootWith,
  hook,
  hookStart,
  hookEnd,
  hookAfter,
  hookStartAfter,
  hookEndAfter,
} = require('./src/effects')


module.exports = {
  toot,
  tootWith,
  hook,
  hookStart,
  hookEnd,
  hookAfter,
  hookStartAfter,
  hookEndAfter,
}

Object.keys(corrieEffects).forEach((key) => {
  module.exports[key] = corrieEffects[key]
})
