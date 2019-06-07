import * as crypto from './crypto'

describe('crypto', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules() // this is important - it clears the cache
    process.env = { ...OLD_ENV }
    delete process.env.AES_KEY_PASSWORD
  })
  afterEach(() => {
    process.env = OLD_ENV
  })

  test('encrypt then decrypt is idempotent', async () => {
    process.env.AES_KEY_PASSWORD = '2S/VIchEq2c/qQPd7NNnaV3bqwU2Bu9dtWzw4bQa5t0'
    const expected = 'IY1IChWldjqd/mrWdtct7rJ06jeWwSzAj1pgbcX6fCU'
    const encrypted = await crypto.encrypt(expected)
    expect(encrypted).toMatch(
      /^([a-zA-Z0-9-_]+)\.([a-zA-Z0-9-_]+)\.([a-zA-Z0-9-_]+)\.([a-zA-Z0-9-_]+)$/
    )
    const received = await crypto.decrypt(encrypted)
    expect(received).toEqual(expected)
  })
})
