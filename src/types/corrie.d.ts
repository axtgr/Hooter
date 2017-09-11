declare module 'corrie' {
  export = corrie

  function corrie(...routines: Function[]): Function
  function corrie(settings: corrie.Settings): typeof corrie
  function corrie(settings: corrie.Settings, ...routines: Function[]): Function

  namespace corrie {
    const enum ExecutionMode {
      Auto = 'auto',
      AsIs = 'asIs',
      Async = 'async',
      Sync = 'sync'
    }

    interface Effect {
      effect: string
      [key: string]: any
    }

    type EffectHandler = (effect: Effect, execution: any) => any

    interface Settings {
      mode?: corrie.ExecutionMode
      effects?: {
        [key: string]: EffectHandler
      }
      state?: object
      [key: string]: any
    }

    const DEFAULT_SETTINGS: Settings

    function auto(...args: any[]): any
  }
}

declare module 'corrie/src/effects/fork'
