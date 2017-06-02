let corrieEffects = require('corrie/effects')
let { toot, tootWith } = require('./src/effects')

Object.keys(corrieEffects).forEach((key) => {
  module.exports[key] = corrieEffects[key]
})

module.exports.toot = toot
module.exports.tootWith = tootWith
