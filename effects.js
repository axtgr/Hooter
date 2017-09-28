const corrieEffects = require('corrie/effects')
const {
  toot,
  tootWith,
  hook,
  hookStart,
  hookEnd,
  preHook,
  preHookStart,
  preHookEnd,
  postHook,
  postHookStart,
  postHookEnd,
  hookResult,
  hookStartResult,
  hookEndResult,
} = require('./dist/effects')


// TSLint goes nuts if this isn't sorted alphabetically
module.exports = {
  hook,
  hookEnd,
  hookEndResult,
  hookResult,
  hookStart,
  hookStartResult,
  postHook,
  postHookEnd,
  postHookStart,
  preHook,
  preHookEnd,
  preHookStart,
  toot,
  tootWith,
}

Object.keys(corrieEffects).forEach((key) => {
  module.exports[key] = corrieEffects[key]
})
