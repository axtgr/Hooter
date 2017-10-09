import DagMap from 'dag-map'
import { Item } from './Store'

interface TagMap {
  [key: string]: string[]
}

function sortItems<T extends Item>(items: T[]): T[] {
  let map = new DagMap<T>()
  let relations: TagMap = {}
  let lowPriority: T[] = []
  let highPriority: T[] = []

  for (let i = 0; i < items.length; i++) {
    let item = items[i]
    let { tags, goesBefore, goesAfter } = item
    let key = String(i)

    if (
      (goesBefore === '**' && goesAfter) ||
      (goesAfter === '**' && goesBefore)
    ) {
      throw new Error(
        'When "goesBefore" or "goesAfter" is "**", the other one must be undefined'
      )
    } else if (goesBefore === '**') {
      lowPriority.push(item)
      continue
    } else if (goesAfter === '**') {
      highPriority.unshift(item)
      continue
    }

    if (tags) {
      for (let j = 0; j < tags.length; j++) {
        let tag = tags[j]
        relations[tag] = relations[tag] || []
        relations[tag].push(key)
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    let item = items[i]
    let key = String(i)
    let { goesBefore, goesAfter } = item
    let realBefore: string[] = []
    let realAfter: string[] = []

    if (goesBefore === '**' || goesAfter === '**') {
      continue
    }

    if (goesBefore) {
      for (let j = 0; j < goesBefore.length; j++) {
        let tag = goesBefore[j]
        let tagItems = relations[tag] as string[]
        relations[tag] && realBefore.push(...tagItems)
      }
    }

    if (goesAfter) {
      for (let j = 0; j < goesAfter.length; j++) {
        let tag = goesAfter[j]
        let tagItems = relations[tag] as string[]
        relations[tag] && realAfter.push(...tagItems)
      }
    }

    map.add(key, item, realBefore, realAfter)
  }

  let result: T[] = lowPriority
  map.each((key, value) => {
    value && result.push(value)
  })
  return result.concat(highPriority)
}

export { sortItems as default }
