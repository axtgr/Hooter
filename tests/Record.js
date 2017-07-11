const Record = require('../src/Record')


describe('Record', () => {
  describe('constructor', () => {
    it('throws when no store is provided', () => {
      expect(() => new Record()).toThrow()
    })

    it('sets "store", "key" and "value" properties', () => {
      let store = {}
      let record = new Record(store, 'foo', 'bar')

      expect(record.store).toBe(store)
      expect(record.key).toBe('foo')
      expect(record.value).toBe('bar')
    })
  })

  describe('#unhook()', () => {
    it('calls del() on the store', () => {
      let store = jasmine.createSpyObj('foo', ['del'])
      let record = new Record(store)
      record.unhook()

      expect(store.del).toHaveBeenCalledWith(record)
    })
  })
})
