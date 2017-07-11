const Store = require('../src/Store')
const Record = require('../src/Record')


function match(a, b) {
  return a === b || a === '*' || b === '*'
}

function handlerA() {}
function handlerB() {}

describe('Store', () => {
  describe('constructor', () => {
    it('throws when no matching function is provided', () => {
      expect(() => new Store()).toThrow()
      expect(() => new Store(12)).toThrow()
    })
  })

  describe('#matchRecord()', () => {
    it('matches record instances by strict equality', () => {
      let store = new Store(match)
      let recordA = new Record({}, 'foo', handlerA)
      let recordAA = new Record({}, 'foo', handlerA)
      let recordB = new Record({}, 'bar', handlerB)

      let result1 = store.matchRecord(recordA, recordA)
      let result2 = store.matchRecord(recordA, recordAA)
      let result3 = store.matchRecord(recordA, recordB)

      expect(result1).toBe(true)
      expect(result2).toBe(false)
      expect(result3).toBe(false)
    })

    it('matches record keys using the matching function', () => {
      let store = new Store(match)
      let recordA = new Record({}, 'foo', handlerA)
      let recordB = new Record({}, 'bar', handlerB)
      let recordC = new Record({}, '*', handlerA)

      let result1 = store.matchRecord(recordA, 'foo')
      let result2 = store.matchRecord(recordB, 'bar')
      let result3 = store.matchRecord(recordA, 'bar')
      let result4 = store.matchRecord(recordA, '*')
      let result5 = store.matchRecord(recordC, 'foo')
      let result6 = store.matchRecord(recordC, '*')

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(result3).toBe(false)
      expect(result4).toBe(true)
      expect(result5).toBe(true)
      expect(result6).toBe(true)
    })
  })

  describe('#get()', () => {
    it('returns an empty array when nothing is found', () => {
      let store = new Store(match)
      let result1 = store.get('foo')
      store.put('bar', handlerA)
      let result2 = store.get('baz')

      expect(result1).toEqual([])
      expect(result2).toEqual([])
    })

    it('returns a new array every time', () => {
      let store = new Store(match)
      let foo1 = store.get('foo')
      let foo2 = store.get('foo')
      store.put('bar', handlerA)
      let bar1 = store.get('bar')
      let bar2 = store.get('bar')
      let all1 = store.get()
      let all2 = store.get()

      expect(foo1).toEqual(jasmine.any(Array))
      expect(foo2).toEqual(jasmine.any(Array))
      expect(foo1).not.toBe(foo2)

      expect(bar1).toEqual(jasmine.any(Array))
      expect(bar2).toEqual(jasmine.any(Array))
      expect(bar1).not.toBe(bar2)

      expect(all1).toEqual(jasmine.any(Array))
      expect(all2).toEqual(jasmine.any(Array))
      expect(all1).not.toBe(all2)
    })

    it('returns an array of all the records when no needle provided', () => {
      let store = new Store(match)
      store.put('foo', handlerA)
      store.put('bar', handlerB)
      let result1 = store.get()
      store.put('*', handlerB)
      let result2 = store.get()

      expect(result1).toEqual([
        new Record(store, 'foo', handlerA),
        new Record(store, 'bar', handlerB),
      ])
      expect(result2).toEqual([
        new Record(store, 'foo', handlerA),
        new Record(store, 'bar', handlerB),
        new Record(store, '*', handlerB),
      ])
    })

    it('returns an array of matching records', () => {
      let store = new Store(match)
      store.put('foo', handlerA)
      store.put('bar', handlerB)
      store.put('bar', handlerA)
      store.put('*', handlerB)

      let foo = store.get('foo')
      let bar = store.get('bar')
      let baz = store.get('baz')
      let asterisk = store.get('*')

      expect(foo).toEqual([
        new Record(store, 'foo', handlerA),
        new Record(store, '*', handlerB),
      ])
      expect(bar).toEqual([
        new Record(store, 'bar', handlerB),
        new Record(store, 'bar', handlerA),
        new Record(store, '*', handlerB),
      ])
      expect(baz).toEqual([new Record(store, '*', handlerB)])
      expect(asterisk).toEqual([
        new Record(store, 'foo', handlerA),
        new Record(store, 'bar', handlerB),
        new Record(store, 'bar', handlerA),
        new Record(store, '*', handlerB),
      ])
    })
  })

  describe('#put()', () => {
    it('returns the created record', () => {
      let store = new Store(match)
      let record = store.put('foo', handlerA)

      expect(record).toEqual(jasmine.any(Record))
      expect(record).toEqual(new Record(store, 'foo', handlerA))
    })
  })

  describe('#del()', () => {
    it('deletes matching records', () => {
      let store = new Store(match)
      store.put('foo', handlerA)
      let recordB = store.put('bar', handlerA)
      store.put('bar', handlerB)

      store.del(recordB)
      let result1 = store.get()
      expect(result1).toEqual([
        new Record(store, 'foo', handlerA),
        new Record(store, 'bar', handlerB),
      ])

      store.del('foo')
      let result2 = store.get()
      expect(result2).toEqual([new Record(store, 'bar', handlerB)])
    })

    it('deletes all the records when no needle is provided', () => {
      let store = new Store(match)
      store.put('foo', handlerA)
      store.put('bar', handlerB)
      store.put('baz', handlerA)
      store.del()
      let result = store.get()

      expect(result).toEqual([])
    })
  })

  describe('reverse mode', () => {
    describe('#get()', () => {
      it('retrieves records in reverse order', () => {
        let store = new Store(match, true)
        store.put('foo', handlerA)
        store.put('bar', handlerB)
        store.put('bar', handlerA)
        store.put('baz', handlerB)
        let result = store.get()

        expect(result).toEqual([
          new Record(store, 'baz', handlerB),
          new Record(store, 'bar', handlerA),
          new Record(store, 'bar', handlerB),
          new Record(store, 'foo', handlerA),
        ])
      })
    })
  })
})
