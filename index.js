let hooterModule = require('./dist/Hooter')

module.exports = hooterModule.default
Object.defineProperty(module.exports, 'default', { writable: true })
Object.assign(module.exports, hooterModule)
