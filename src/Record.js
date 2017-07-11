module.exports = class Record {
  constructor(store, key, value) {
    if (!store) {
      throw new Error('A store is required')
    }

    this.store = store
    this.key = key
    this.value = value
  }

  unhook() {
    this.store.del(this)
  }
}
