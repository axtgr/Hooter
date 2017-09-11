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
  hookResult,
  hookStartResult,
  hookEndResult,
} = require('./dist/effects')


module.exports = {
  toot,
  tootWith,
  hook,
  hookStart,
  hookEnd,
  hookAfter,
  hookStartAfter,
  hookEndAfter,
  hookResult,
  hookStartResult,
  hookEndResult,
}

Object.keys(corrieEffects).forEach((key) => {
  module.exports[key] = corrieEffects[key]
})
