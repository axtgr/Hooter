import DagMap from 'dag-map'
import { Item } from './Store'

enum Priority {
  Before = 'before',
  Normal = 'normal',
  After = 'after',
}

interface TagObject {
  before?: string[]
  normal?: string[]
  after?: string[]
}

interface TagMap {
  [key: string]: TagObject
}

function makeItemKey(item: Item, index: number) {
  let name = (item as any).name
  return name ? `${index} (${name})` : String(index)
}

function mapTagsToItemKeys(items: Item[]) {
  let result: TagMap = {}

  for (let i = 0; i < items.length; i++) {
    let item = items[i]
    let { tags, goesBefore, goesAfter } = item
    let key = makeItemKey(item, i)
    let allTags = ['**']

    if (tags) {
      allTags.push(...tags)
    }

    for (let j = 0; j < allTags.length; j++) {
      let tag = allTags[j]
      result[tag] = result[tag] || {}

      if (goesBefore && goesBefore.includes(tag)) {
        result[tag].before = result[tag].before || []
        ;(result[tag].before as string[]).push(key)
      } else if (goesAfter && goesAfter.includes(tag)) {
        result[tag].after = result[tag].after || []
        ;(result[tag].after as string[]).push(key)
      } else {
        result[tag].normal = result[tag].normal || []
        ;(result[tag].normal as string[]).push(key)
      }
    }
  }

  return result
}

function resolveDeps(
  itemsByTag: TagMap,
  key: string,
  tags: string[] | undefined,
  deps: string[],
  priority: Priority
) {
  let result = []

  for (let i = 0; i < deps.length; i++) {
    let tagObject = itemsByTag[deps[i]]

    // Skipping is for when an item both has a tag and also goesBefore/After it
    let skip = deps[i] === '**' || (tags && tags.includes(deps[i]))

    if (tagObject) {
      let { before, normal, after } = tagObject

      if (before && skip && priority !== Priority.Before) {
        for (let j = 0; j < before.length; j++) {
          if (key !== before[j]) {
            result.push(before[j])
          }
        }
      }

      if (normal) {
        for (let j = 0; j < normal.length; j++) {
          if (key !== normal[j]) {
            result.push(normal[j])
          }
        }
      }

      if (after) {
        let skipAfter = skip && priority === Priority.After
        for (let j = after.length - 1; j >= 0; j--) {
          if (key !== after[j]) {
            result.push(after[j])
          } else if (skipAfter) {
            break
          }
        }
      }
    }
  }

  return result
}

function createDagMapForItems<T extends Item>(items: T[]) {
  let itemsByTag: TagMap = mapTagsToItemKeys(items)
  let result = new DagMap<T>()

  for (let i = 0; i < items.length; i++) {
    let item = items[i]
    let { tags, goesBefore, goesAfter } = item
    let key = makeItemKey(item, i)

    if (goesBefore) {
      // tslint:disable-next-line:prettier
      goesBefore = resolveDeps(itemsByTag, key, tags, goesBefore, Priority.Before)
    }

    if (goesAfter) {
      goesAfter = resolveDeps(itemsByTag, key, tags, goesAfter, Priority.After)
    }

    result.add(key, item, goesBefore, goesAfter)
  }

  return result
}

function dagMapToArray<T extends Item>(map: DagMap<T>) {
  let result: T[] = []
  map.each((key, value) => {
    value && result.push(value)
  })
  return result
}

function sortItems<T extends Item>(items: T[]): T[] {
  let map = createDagMapForItems<T>(items)
  return dagMapToArray(map)
}

export { Item, sortItems as default }
