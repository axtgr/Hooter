class Handler {
  constructor(store, key, fn) {
    this.store = store
    this.key = key
    this.fn = fn
  }

  unhook() {
    this.store.delHandler(this)
  }
}

module.exports = class HandlerStore {
  constructor(match, reverse) {
    this.handlers = []
    this.match = match
    this.reverse = !!reverse
  }

  matchHandler(handler, needle) {
    return handler.fn === needle || this.match(handler.key, needle)
  }

  put(key, fn) {
    let handler = new Handler(this, key, fn)

    if (this.reverse) {
      this.handlers.unshift(handler)
    } else {
      this.handlers.push(handler)
    }

    return handler
  }

  get(needle) {
    return this.handlers.filter((handler) => this.matchHandler(handler, needle))
  }

  del(needle) {
    this.handlers = this.handlers.filter((handler) => {
      return !this.matchHandler(handler, needle)
    })
  }

  delHandler(handler) {
    this.handlers = this.handlers.filter((_handler) => _handler !== handler)
  }
}
