module.exports = class Store {
  constructor(match) {
    if (typeof match !== 'function') {
      throw new Error('A matching function is required')
    }

    this.startItems = []
    this.items = []
    this.endItems = []
    this.match = match
  }

  prepend(item) {
    this.startItems.push(item)
  }

  add(item) {
    this.items.push(item)
  }

  append(item) {
    this.endItems.unshift(item)
  }

  get(needle) {
    if (typeof needle === 'undefined') {
      return this.startItems.concat(this.items, this.endItems)
    }

    return this.startItems.concat(this.items, this.endItems).filter((item) => {
      return this.match(item, needle)
    })
  }

  del(needle) {
    if (typeof needle === 'undefined') {
      this.startItems = []
      this.items = []
      this.endItems = []
    } else {
      this.startItems = this.startItems.filter((item) => {
        return !this.match(item, needle)
      })
      this.items = this.items.filter((item) => {
        return !this.match(item, needle)
      })
      this.endItems = this.endItems.filter((item) => {
        return !this.match(item, needle)
      })
    }
  }
}
