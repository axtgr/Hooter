const HooterBase = require('./HooterBase')


class HooterProxy extends HooterBase {
  constructor(source) {
    super()
    this.source = source
    this.corrie = this.source.corrie
  }

  proxy() {
    return new HooterProxy(this)
  }

  getEvent(name) {
    if (this.source) {
      return this.source.getEvent(name)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  handlers(needle) {
    if (this.source) {
      return this.source.handlers(needle)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  register(name, mode) {
    if (this.source) {
      return this.source.register(name, mode)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  unhook(handler) {
    if (this.source) {
      return this.source.unhook(handler)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  _hookHandler(handler, priority) {
    if (this.source) {
      return this.source._hookHandler(handler, priority)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }

  _tootEvent(event) {
    if (this.source) {
      return this.source._tootEvent(event)
    }

    throw new Error(
      'This hooter proxy doesn\'t have a source assigned, which is required'
    )
  }
}

module.exports = HooterProxy
