const assert = require('assert')
const { describe, it } = require('mocha')
const sortItems = require('../dist/sortItems').default

describe('sortItems', () => {
  it("keeps the order of items when they don't have any ordering properties set", () => {
    let itemA = {}
    let itemB = {}
    let itemC = {}
    let items = [itemA, itemB, itemC]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemA, itemB, itemC])
  })

  it('keeps the order of items when they only have the "tags" property set', () => {
    let itemA = { tags: ['A'] }
    let itemB = {}
    let itemC = { tags: ['C'] }
    let items = [itemA, itemB, itemC]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemA, itemB, itemC])
  })

  it('sorts items correctly when there are no cycles', () => {
    let itemA = { tags: ['A'], goesAfter: ['B'] }
    let itemB = { tags: ['B'] }
    let itemC = { goesBefore: ['B'] }
    let items1 = [itemA, itemB, itemC]

    let result1 = sortItems(items1)
    assert.deepStrictEqual(result1, [itemC, itemB, itemA])

    let itemD = { tags: ['D'], goesAfter: ['F', 'H', 'G'], goesBefore: ['E'] }
    let itemE = { tags: ['E'] }
    let itemF = { tags: ['F'], goesBefore: ['H'] }
    let itemG = { tags: ['G'], goesBefore: ['H', 'F'] }
    let itemH = { tags: ['H'] }
    let items2 = [itemD, itemE, itemF, itemG, itemH]

    let result2 = sortItems(items2)
    assert.deepStrictEqual(result2, [itemG, itemF, itemH, itemD, itemE])
  })

  it('sorts items correctly when there are legit cycles like "itemA goesAfter itemB and itemB goesBefore itemA"', () => {
    let itemA = { tags: ['A'], goesAfter: ['B'] }
    let itemB = { tags: ['B'], goesBefore: ['A'] }
    let itemC = {}
    let items1 = [itemA, itemB, itemC]

    let result1 = sortItems(items1)
    assert.deepStrictEqual(result1, [itemB, itemA, itemC])

    let itemD = { tags: ['D'], goesAfter: ['E'] }
    let itemE = { tags: ['E'], goesAfter: ['F'], goesBefore: ['D'] }
    let itemF = { tags: ['F'], goesBefore: ['E'] }
    let items2 = [itemD, itemE, itemF]

    let result2 = sortItems(items2)
    assert.deepStrictEqual(result2, [itemF, itemE, itemD])
  })

  it('gives high priority to an item with a "tag" when it has "goesBefore: [\'tag\']"', () => {
    let itemA1 = { tags: ['A'] }
    let itemA2 = { tags: ['A'], goesBefore: ['A'] }
    let itemA3 = { tags: ['A'] }
    let items = [itemA1, itemA2, itemA3]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemA2, itemA1, itemA3])
  })

  it('gives low priority to an item with a "tag" when it has "goesAfter: [\'tag\']"', () => {
    let itemA1 = { tags: ['A'] }
    let itemA2 = { tags: ['A'], goesAfter: ['A'] }
    let itemA3 = { tags: ['A'] }
    let items = [itemA1, itemA2, itemA3]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemA1, itemA3, itemA2])
  })

  it('allows low- and high-priority items within a single tag', () => {
    let itemA = { tags: ['A', 'Q'], goesAfter: ['Q'] }
    let itemB = { tags: ['B', 'Q'], goesBefore: ['Q'] }
    let itemC = { tags: ['C', 'Q'] }
    let items = [itemA, itemB, itemC]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemB, itemC, itemA])
  })

  it('sorts items correctly when there are legit cycles within a common tag', () => {
    let itemA = { tags: ['A', 'Q'], goesAfter: ['B'] }
    let itemB = { tags: ['B', 'Q'], goesBefore: ['Q'] }
    let itemC = {}
    let items1 = [itemA, itemB, itemC]

    let result1 = sortItems(items1)
    assert.deepStrictEqual(result1, [itemB, itemA, itemC])

    let itemD = { tags: ['D', 'Q'], goesAfter: ['Q'] }
    let itemE = { tags: ['E', 'Q'], goesBefore: ['Q', 'F'] }
    let itemF = { tags: ['F', 'Q'], goesBefore: ['D'], goesAfter: ['E'] }
    let items2 = [itemD, itemE, itemF]

    let result2 = sortItems(items2)
    assert.deepStrictEqual(result2, [itemE, itemF, itemD])
  })

  it('allows multiple items to have high priority within a tag and sorts them in their natural order', () => {
    let itemA = { tags: ['A', 'Q'] }
    let itemB = { tags: ['B', 'Q'], goesBefore: ['Q'] }
    let itemC = { tags: ['C', 'Q'], goesBefore: ['Q'] }
    let items = [itemA, itemB, itemC]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemB, itemC, itemA])
  })

  it('allows multiple items to have low priority within a tag and reverses their natural order', () => {
    let itemA = { tags: ['A', 'Q'], goesAfter: ['Q'] }
    let itemB = { tags: ['B', 'Q'] }
    let itemC = { tags: ['C', 'Q'], goesAfter: ['Q'] }
    let items = [itemA, itemB, itemC]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemB, itemC, itemA])
  })

  it('allows items to have different priorities within a tag', () => {
    let itemA = { tags: ['A', 'Q'], goesAfter: ['Q'] }
    let itemB = { tags: ['B', 'Q'], goesBefore: ['Q'] }
    let itemC = { tags: ['C', 'Q'], goesAfter: ['Q'] }
    let items1 = [itemA, itemB, itemC]

    let result1 = sortItems(items1)
    assert.deepStrictEqual(result1, [itemB, itemC, itemA])

    let itemD = { tags: ['D', 'Q'], goesAfter: ['Q'] }
    let itemE = { tags: ['E', 'Q'], goesBefore: ['Q'] }
    let itemF = { tags: ['F', 'Q'], goesBefore: ['Q'] }
    let items2 = [itemD, itemE, itemF]

    let result2 = sortItems(items2)
    assert.deepStrictEqual(result2, [itemE, itemF, itemD])
  })

  it('gives high priority to an item when it has "goesBefore: [\'**\']"', () => {
    let itemA1 = {}
    let itemA2 = { goesBefore: ['**'] }
    let itemA3 = {}
    let items = [itemA1, itemA2, itemA3]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemA2, itemA1, itemA3])
  })

  it('gives low priority to an item when it has "goesAfter: [\'**\']"', () => {
    let itemA1 = {}
    let itemA2 = { goesAfter: ['**'] }
    let itemA3 = {}
    let items = [itemA1, itemA2, itemA3]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemA1, itemA3, itemA2])
  })

  it('sorts items correctly when more than one of them use "**" and there are no cycles', () => {
    let itemA = { tags: ['A'], goesAfter: ['**'] }
    let itemB = { tags: ['B'] }
    let itemC = { goesBefore: ['**'] }
    let items1 = [itemA, itemB, itemC]

    let result1 = sortItems(items1)
    assert.deepStrictEqual(result1, [itemC, itemB, itemA])

    let itemD = { tags: ['D'], goesAfter: ['F', 'H', 'G'] }
    let itemE = { tags: ['E'], goesAfter: '**' }
    let itemF = { tags: ['F'], goesBefore: ['H'] }
    let itemG = { tags: ['G'], goesBefore: ['**'] }
    let itemH = { tags: ['H'] }
    let items2 = [itemD, itemE, itemF, itemG, itemH]

    let result2 = sortItems(items2)
    assert.deepStrictEqual(result2, [itemG, itemF, itemH, itemD, itemE])
  })

  it('allows multiple items to have high priority in "**" and sorts them in their natural order', () => {
    let itemA = { tags: ['A', 'Q'] }
    let itemB = { tags: ['B', 'Q'], goesBefore: ['**'] }
    let itemC = { tags: ['C', 'Q'], goesBefore: ['**'] }
    let items = [itemA, itemB, itemC]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemB, itemC, itemA])
  })

  it('allows multiple items to have low priority in "**" and reverses their natural order', () => {
    let itemA = { tags: ['A'], goesAfter: ['**'] }
    let itemB = { tags: ['B'] }
    let itemC = { tags: ['C'], goesAfter: ['**'] }
    let items = [itemA, itemB, itemC]

    let result = sortItems(items)
    assert.deepStrictEqual(result, [itemB, itemC, itemA])
  })

  it('allows items to have different priorities in "**"', () => {
    let itemA = { tags: ['A'], goesAfter: ['**'] }
    let itemB = { tags: ['B'], goesBefore: ['**'] }
    let itemC = { tags: ['C'], goesAfter: ['**'] }
    let items1 = [itemA, itemB, itemC]

    let result1 = sortItems(items1)
    assert.deepStrictEqual(result1, [itemB, itemC, itemA])
  })

  it('throws when there are unresolvable cycles in a single item with different tags', () => {
    let itemA = { tags: ['A'], goesBefore: ['B'], goesAfter: ['B'] }
    let itemB = { tags: ['B'] }
    let items = [itemA, itemB]

    assert.throws(() => sortItems(items))
  })

  it('throws when there are unresolvable cycles in a single item within a single tag', () => {
    let itemA = { tags: ['Q'], goesBefore: ['Q'], goesAfter: ['Q'] }
    let itemB = { tags: ['Q'] }
    let items = [itemA, itemB]

    assert.throws(() => sortItems(items))
  })

  it('throws when there are unresolvable cycles in a single item within "**"', () => {
    let itemA = { tags: ['A'], goesBefore: ['**'], goesAfter: ['**'] }
    let itemB = { tags: ['B'] }
    let items = [itemA, itemB]

    assert.throws(() => sortItems(items))
  })

  it('throws when there are unresolvable cycles between different items with different tags', () => {
    let itemA = { tags: ['A'], goesAfter: ['C'] }
    let itemB = { tags: ['B'] }
    let itemC = { tags: ['C'], goesAfter: ['A'] }
    let items1 = [itemA, itemB, itemC]

    assert.throws(() => sortItems(items1))

    let itemD = { tags: ['D'], goesAfter: ['F'] }
    let itemE = { tags: ['E'], goesBefore: ['D'] }
    let itemF = { tags: ['F'], goesBefore: ['E'] }
    let items2 = [itemA, itemB, itemC]

    assert.throws(() => sortItems(items2))
  })

  it('throws when there are unresolvable cycles between different items with the same tags', () => {
    let itemA = { tags: ['Q', 'W'], goesAfter: ['Q'] }
    let itemB = { tags: ['Q', 'W'] }
    let itemC = { tags: ['Q', 'W'], goesAfter: ['W'] }
    let items = [itemA, itemB, itemC]

    assert.throws(() => sortItems(items))
  })

  it('favors same-tag dependency over other dependencies', () => {
    let itemA = { tags: ['A', 'Q'], goesAfter: ['Q'] }
    let itemB = { tags: ['B', 'Q'] }
    let itemC = { tags: ['C', 'Q'], goesAfter: ['A'] }
    let items = [itemA, itemB, itemC]

    assert.throws(() => sortItems(items))
  })
})
