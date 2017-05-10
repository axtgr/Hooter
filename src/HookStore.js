function isRecordEqualToNeedle(record, needle) {
  return record.value === needle || record.key === needle
}

module.exports = class HookStore {
  constructor(match, reverse) {
    this.records = []
    this.match = match || isRecordEqualToNeedle
    this.reverse = !!reverse
  }

  put(key, value) {
    let record = { key, value }

    if (this.reverse) {
      this.records.unshift(record)
    } else {
      this.records.push(record)
    }
  }

  get(needle) {
    let match = this.match
    return this.records
      .filter((record) => match(record, needle))
      .map((record) => record.value)
  }

  del(needle) {
    let match = this.match
    this.records = this.records.filter((record) => !match(record, needle))
  }
}
