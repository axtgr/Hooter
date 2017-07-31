module.exports = class Store {
  constructor(Record, match, reverse) {
    if (typeof Record !== 'function') {
      throw new Error('A record constructor is required')
    }

    if (typeof match !== 'function') {
      throw new Error('A matching function is required')
    }

    this.Record = Record
    this.records = []
    this.match = match
    this.reverse = !!reverse
  }

  matchRecord(record, needle) {
    return record === needle || this.match(record.key, needle)
  }

  put(key, value) {
    if (typeof key === 'undefined') {
      throw new Error('A key must not be undefined')
    }

    let record = new this.Record(this, key, value)

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
