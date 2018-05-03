import ms from 'ms'

const defaultOptions = {
  ttl: '3s',
  refreshRate: '1s'
}

export default class Cache {
  constructor(_options = {}) {
    const opt = { ...defaultOptions, ..._options }
    this.options = {
      ttl: ms(opt.ttl),
      refreshRate: ms(opt.refreshRate)
    }
    this.state = {}
    this.timer = setInterval(this._tick.bind(this), this.options.refreshRate)
  }

  set(key, value) {
    this.state[key] = {
      value,
      time: Date.now()
    }
    return value
  }

  has(key) {
    return this.state.hasOwnProperty(key)
  }

  get(key) {
    return this.state[key].value
  }

  delete(key) {
    delete this.state[key]
  }

  _tick() {
    const now = Date.now()
    const stateCopy = { ...this.state }
    Object.keys(stateCopy).forEach(key => {
      const time = this.state[key].time + this.options.ttl
      if (time < now) {
        this.delete(key)
      }
    })
  }
}
