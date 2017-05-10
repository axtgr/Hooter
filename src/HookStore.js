class Hook {
  constructor(store, key, fn) {
    this.store = store
    this.key = key
    this.fn = fn
  }

  unhook() {
    this.store.delHook(this)
  }
}

module.exports = class HookStore {
  constructor(match, reverse) {
    this.hooks = []
    this.match = match
    this.reverse = !!reverse
  }

  matchHook(hook, needle) {
    return hook.fn === needle || this.match(hook.key, needle)
  }

  put(key, fn) {
    let hook = new Hook(this, key, fn)

    if (this.reverse) {
      this.hooks.unshift(hook)
    } else {
      this.hooks.push(hook)
    }

    return hook
  }

  get(needle) {
    return this.hooks.filter((hook) => this.matchHook(hook, needle))
  }

  del(needle) {
    this.hooks = this.hooks.filter((hook) => !this.matchHook(hook, needle))
  }

  delHook(hook) {
    this.hooks = this.hooks.filter((_hook) => _hook !== hook)
  }
}
