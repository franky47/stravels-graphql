// @flow
import ms from 'ms'

type Options = {
  ttl: ms,
  refreshRate: ms
}

type CacheItem = {
  +value: any,
  +time: number
}

export default class Cache {
  // Member types
  options: Options
  state: Map<string, CacheItem>
  timer: IntervalID

  constructor({ ttl = '3s', refreshRate = '1s' }: Options = {}) {
    this.options = {
      ttl: ms(ttl),
      refreshRate: ms(refreshRate)
    }
    this.state = new Map()
    this.timer = setInterval(this._tick.bind(this), this.options.refreshRate)
  }

  // --

  set(key: string, value: any) {
    this.state.set(key, {
      value,
      time: Date.now()
    })
    return value
  }

  has(key: string): boolean {
    return this.state.has(key)
  }

  get(key: string): any {
    return this.state.get(key)
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
