const corrieEffects = require('corrie/effects')
const { toot, tootWith, hook, hookStart, hookEnd } = require('./src/effects')


Object.keys(corrieEffects).forEach((key) => {
  module.exports[key] = corrieEffects[key]
})

module.exports.toot = toot
module.exports.tootWith = tootWith
module.exports.hook = hook
module.exports.hookStart = hookStart
module.exports.hookEnd = hookEnd
