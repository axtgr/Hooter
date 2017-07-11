const Record = require('./Record')


module.exports = class Store {
  constructor(match, reverse) {
    if (!match || typeof match !== 'function') {
      throw new Error('A matching function is required')
    }

    this.records = []
    this.match = match
    this.reverse = !!reverse
  }

  matchRecord(record, needle) {
    return record === needle || this.match(record.key, needle)
  }

  put(key, value) {
    let record = new Record(this, key, value)

    if (this.reverse) {
      this.records.unshift(record)
    } else {
      this.records.push(record)
    }

    return record
  }

  get(needle) {
    if (typeof needle === 'undefined') {
      return this.records.slice()
    }

    return this.records.filter((record) => {
      return this.matchRecord(record, needle)
    })
  }

  del(needle) {
    if (typeof needle === 'undefined') {
      this.records = []
    } else {
      this.records = this.records.filter((record) => {
        return !this.matchRecord(record, needle)
      })
    }
  }
}
