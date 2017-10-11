import DagMap from 'dag-map'
import { Events } from './events'
import sortItems from './sortItems'

interface Item {
  tags?: string[]
  goesBefore?: string[]
  goesAfter?: string[]
}

class Store<T extends Item> {
  private items: T[] = []
  private cache: { [key: string]: T[] }

  constructor(private match: (item: T, needle?: T | string) => boolean) {
    this.flushCache()
  }

  private flushCache() {
    this.cache = Object.create(null)
  }

  add(item: T): void {
    this.flushCache()
    this.items.push(item)
  }

  get(needle?: T | string): T[] {
    if (typeof needle !== 'string') {
      return this.items.filter(item => {
        return this.match(item, needle)
      })
    }

    let key

    if (typeof needle === 'undefined') {
      key = '**'
    } else if (typeof needle === 'string') {
      key = needle
    } else {
      throw new Error(
        'A needle must be a string or an item with a key property'
      )
    }

    let { cache } = this

    if (cache[key]) {
      return cache[key].slice()
    }

    if (key === '**') {
      cache[key] = this.items
    } else {
      cache[key] = this.items.filter(item => {
        return this.match(item, needle)
      })
    }

    try {
      cache[key] = sortItems(cache[key])
    } catch (err) {
      throw new Error(`Unable to sort items: ${err.message}`)
    }

    return cache[key]
  }

  del(needle?: T | string): void {
    this.flushCache()

    if (typeof needle === 'undefined' || needle === '**') {
      this.items = []
    } else {
      this.items = this.items.filter(item => {
        return !this.match(item, needle)
      })
    }
  }
}

export { Item, Store as default }
