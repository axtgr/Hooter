import DagMap from 'dag-map'
import { WrappedPlugin } from './Hooter'

function sortPlugins(plugins: WrappedPlugin[]): WrappedPlugin[] {
  let map = new DagMap<WrappedPlugin>()
  let relations: { [key: string]: string[] } = {}

  plugins.forEach(plugin => {
    let { name, tags } = plugin.raw

    relations[name] = relations[name] || []
    relations[name].push(name)

    if (tags) {
      tags.forEach(tag => {
        relations[tag] = relations[tag] || []
        relations[tag].push(name)
      })
    }
  })

  plugins.forEach(plugin => {
    let { name, before, after } = plugin.raw
    let realBefore: string[] = []
    let realAfter: string[] = []

    if (before) {
      before.forEach(item => {
        if (relations[item]) {
          realBefore.push(...relations[item])
        }
      })
    }

    if (after) {
      after.forEach(item => {
        if (relations[item]) {
          realAfter.push(...relations[item])
        }
      })
    }

    map.add(name, plugin, realBefore, realAfter)
  })

  let result: WrappedPlugin[] = []
  map.each((key, value) => {
    value && result.push(value)
  })
  return result
}

export default sortPlugins
