import ms from 'ms'

interface Options {
  ttl?: any
  refreshRate?: any
}

interface CacheItem<T> {
  value: T
  time: number
}

export default class Cache<T> {
  // Member types
  options: Options
  state: Map<string, CacheItem<T>>
  timer: NodeJS.Timeout

  constructor({ ttl = '3s', refreshRate = '1s' }: Options = {}) {
    this.options = {
      ttl: ms(ttl),
      refreshRate: ms(refreshRate)
    }
    this.state = new Map()
    this.timer = setInterval(this._tick.bind(this), this.options.refreshRate)
  }

  // --

  set(key: string, value: T) {
    this.state.set(key, {
      value,
      time: Date.now()
    })
    return value
  }

  has(key: string): boolean {
    return this.state.has(key)
  }

  get(key: string): T | undefined {
    const item = this.state.get(key)
    return item && item.value
  }

  delete(key: string) {
    this.state.delete(key)
  }

  // Private --

  _tick() {
    const now = Date.now()
    Array.from(this.state.keys()).forEach(key => {
      const item = this.state.get(key)
      const time = (item ? item.time : 0) + this.options.ttl
      if (time < now) {
        this.delete(key)
      }
    })
  }
}
