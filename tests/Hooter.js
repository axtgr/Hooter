const { describe, it } = require('mocha')
const expect = require('expect')
const Hooter = require('../src/Hooter')


function handlerA() {}
function handlerB() {}

describe('Hooter', () => {
  describe('constructor', () => {
    it('creates an "events" property', () => {
      let hooter = new Hooter()

      expect(hooter.events).toEqual({})
    })
  })

  describe('#lift()', () => {
    it('returns a new instance of hooter', () => {
      let a = new Hooter()
      let b = a.lift()

      expect(b).toBeA(Hooter).toNotBe(a)
    })

    it('the clone delegates hooks and toots to the source')
  })

  describe('#bind()', () => {
    it('lifts the hooter', () => {
      let a = new Hooter()
      let b = a.bind()

      expect(b).toBeA(Hooter).toNotBe(a)
      expect(b.source).toBe(a)
    })

    it('sets the owner property of the clone to the passed argument', () => {
      let owner = {}
      let a = new Hooter()
      let b = a.bind(owner)

      expect(b.owner).toBe(owner)
    })

    it('events tooted via the clone have a proper source defined', () => {
      let owner = {}
      let spy = expect.createSpy()
      let clone = new Hooter().bind(owner)

      clone.hook('foo', spy)
      clone.toot('foo')

      expect(spy).toHaveBeenCalled()
      expect(spy.calls[0].context.tooter).toBe(owner)
    })

    it('events tooted via the clone using an effect have a proper source defined', () => {
      let owner = {}
      let spy = expect.createSpy()
      let clone = new Hooter().bind(owner)

      clone.hook('foo', function* () {
        yield {
          effect: 'toot',
          event: 'bar',
        }
      })
      clone.hook('bar', spy)
      clone.toot('foo')

      expect(spy).toHaveBeenCalled()
      expect(spy.calls[0].context.tooter).toBe(owner)
    })
  })

  describe('#register()', () => {
    it('throws when the event name is not a non-empty string', () => {
      let hooter = new Hooter()

      expect(() => hooter.register()).toThrow()
      expect(() => hooter.register(null, 'auto')).toThrow()
      expect(() => hooter.register(1, 'auto')).toThrow()
      expect(() => hooter.register({}, 'auto')).toThrow()
      expect(() => hooter.register('', 'auto')).toThrow()
      expect(() => hooter.register(new String(), 'auto')).toThrow()
    })

    it('throws when the event is already registered', () => {
      let hooter = new Hooter()
      hooter.register('foo', 'auto')

      expect(() => hooter.register('foo', 'auto')).toThrow()
    })

    it('throws when the event mode is not in the list', () => {
      let hooter = new Hooter()

      expect(() => hooter.register('foo')).toThrow()
      expect(() => hooter.register('bar', 'bar')).toThrow()
      expect(() => hooter.register('baz', 1)).toThrow()
    })

    it('registers the provided event', () => {
      let hooter = new Hooter()
      hooter.register('foo', 'auto')
      hooter.register('bar', 'sync')

      expect(hooter.events.foo).toEqual({ mode: 'auto' })
      expect(hooter.events.bar).toEqual({ mode: 'sync' })
    })
  })

  describe('#handlers()', () => {
    it('returns an empty array when nothing is found', () => {
      let hooter = new Hooter()
      let result1 = hooter.handlers('foo')
      hooter.hook('bar', handlerA)
      let result2 = hooter.handlers('baz')

      expect(result1).toEqual([])
      expect(result2).toEqual([])
    })

    it('returns a new array every time', () => {
      let hooter = new Hooter()
      let foo1 = hooter.handlers('foo')
      let foo2 = hooter.handlers('foo')
      hooter.hook('bar', handlerA)
      let bar1 = hooter.handlers('bar')
      let bar2 = hooter.handlers('bar')
      let all1 = hooter.handlers()
      let all2 = hooter.handlers()

      expect(foo1).toBeA(Array)
      expect(foo2).toBeA(Array)
      expect(foo1).toNotBe(foo2)

      expect(bar1).toBeA(Array)
      expect(bar2).toBeA(Array)
      expect(bar1).toNotBe(bar2)

      expect(all1).toBeA(Array)
      expect(all2).toBeA(Array)
      expect(all1).toNotBe(all2)
    })

    it('returns an array of all the handlers when no needle provided', () => {
      let hooter = new Hooter()
      hooter.hook('foo', handlerA)
      hooter.hook('bar', handlerB)
      let result1 = hooter.handlers(undefined)
      hooter.hookStart('*', handlerB)
      let result2 = hooter.handlers(undefined)

      expect(result1).toBeA(Array)
      expect(result1.length).toBe(2)
      expect(result1[0]).toBeA(Function)
      expect(result1[0].fn).toBe(handlerA)
      expect(result1[1]).toBeA(Function)
      expect(result1[1].fn).toBe(handlerB)

      expect(result2).toBeA(Array)
      expect(result2.length).toBe(3)
      expect(result2[0]).toBeA(Function)
      expect(result2[0].fn).toBe(handlerB)
      expect(result2[1]).toBeA(Function)
      expect(result2[1].fn).toBe(handlerA)
      expect(result2[2]).toBeA(Function)
      expect(result2[2].fn).toBe(handlerB)
    })

    it('returns an array of matching handlers', () => {
      let hooter = new Hooter()
      hooter.hook('foo', handlerA)
      hooter.hook('bar', handlerB)
      let result1 = hooter.handlers('foo')
      hooter.hookStart('foo', handlerB)
      hooter.hookEnd('bar.baz', handlerB)
      hooter.hook('baz', handlerA)
      hooter.hook('*.*', handlerB)
      let result2 = hooter.handlers('bar')
      let result3 = hooter.handlers('*')
      let result4 = hooter.handlers('bar.*')

      expect(result1).toBeA(Array)
      expect(result1.length).toBe(1)
      expect(result1[0]).toBeA(Function)
      expect(result1[0].fn).toBe(handlerA)

      expect(result2).toBeA(Array)
      expect(result2.length).toBe(1)
      expect(result2[0]).toBeA(Function)
      expect(result2[0].fn).toBe(handlerB)

      expect(result3).toBeA(Array)
      expect(result3.length).toBe(4)
      expect(result3[0]).toBeA(Function)
      expect(result3[0].fn).toBe(handlerB)
      expect(result3[1]).toBeA(Function)
      expect(result3[1].fn).toBe(handlerA)
      expect(result3[2]).toBeA(Function)
      expect(result3[2].fn).toBe(handlerB)
      expect(result3[3]).toBeA(Function)
      expect(result3[3].fn).toBe(handlerA)

      expect(result4).toBeA(Array)
      expect(result4.length).toBe(2)
      expect(result4[0]).toBeA(Function)
      expect(result4[0].fn).toBe(handlerB)
      expect(result4[1]).toBeA(Function)
      expect(result4[1].fn).toBe(handlerB)
    })
  })
})
