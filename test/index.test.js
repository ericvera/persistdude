const fs = require('fs')

describe('PersistDude', () => {
  beforeAll(async () => {
    // NOTE: Required ot navigate to a file. `window.crypto.subtle` is not available in 'new tab' context.
    await page.goto('file:///dev/null')

    // Load scripts into browser context
    await page.addScriptTag({
      content: `${fs.readFileSync('./dist/persistdude.js')}`
    })
    await page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`)
    })
  })

  afterEach(async () => {
    await page.evaluate(async () => {
      const db = PersistDude.getDB('kh')
      await db.deleteDb()
    })
  })

  it('can initiate a db without exception', async () => {
    try {
      await page.evaluate(async () => {
        PersistDude.getDB('kh')
      })
    } catch (e) {
      fail('should not have thrown')
    }
  })

  it('can set a document', async () => {
    const result = await page.evaluate(async () => {
      const persistentDB = PersistDude.getDB('kh')
      await persistentDB.add('human/abuo080enlfd', { name: 'hahaha' })
      const data = await persistentDB.get('human/abuo080enlfd')

      return data
    })

    expect(result).toEqual({
      _state: 'new',
      id: 'human/abuo080enlfd',
      name: 'hahaha'
    })
  })

  it('returns undefined if id does not exist', async () => {
    const result = await page.evaluate(async () => {
      const persistentDB = PersistDude.getDB('kh')
      const data = await persistentDB.get('human/abuo080enlfd')

      return data
    })

    expect(result).toBeUndefined()
  })
})
