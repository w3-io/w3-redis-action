import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Test the output serialization logic of the redis action.
 * The key concern is the double-encoding fix: strings stay as strings,
 * objects/arrays get JSON.stringified exactly once.
 */

// Reproduce the action's output serialization logic (line 192)
function serializeOutput(result) {
  return typeof result === 'string' ? result : JSON.stringify(result)
}

describe('output serialization', () => {
  describe('string results stay as strings', () => {
    it('simple string value passes through unchanged', () => {
      assert.equal(serializeOutput('hello'), 'hello')
    })

    it('OK response from SET passes through', () => {
      assert.equal(serializeOutput('OK'), 'OK')
    })

    it('PONG response from PING passes through', () => {
      assert.equal(serializeOutput('PONG'), 'PONG')
    })

    it('numeric string from GET passes through as string', () => {
      assert.equal(serializeOutput('42'), '42')
    })

    it('empty string passes through', () => {
      assert.equal(serializeOutput(''), '')
    })

    it('JSON-like string from GET is NOT double-encoded', () => {
      const stored = '{"key":"value"}'
      const output = serializeOutput(stored)
      // Should be the raw string, not escaped/wrapped in quotes
      assert.equal(output, '{"key":"value"}')
      // Parsing it should give the original object
      assert.deepEqual(JSON.parse(output), { key: 'value' })
    })
  })

  describe('object results get JSON.stringified once', () => {
    it('array from KEYS is stringified', () => {
      const result = ['key1', 'key2', 'key3']
      const output = serializeOutput(result)
      assert.equal(output, '["key1","key2","key3"]')
    })

    it('array from MGET is stringified', () => {
      const result = ['val1', null, 'val3']
      const output = serializeOutput(result)
      assert.equal(output, '["val1",null,"val3"]')
    })

    it('array from LRANGE is stringified', () => {
      const result = ['a', 'b', 'c']
      const output = serializeOutput(result)
      assert.equal(output, '["a","b","c"]')
    })

    it('object from HGETALL is stringified', () => {
      const result = { field1: 'val1', field2: 'val2' }
      const output = serializeOutput(result)
      assert.equal(output, '{"field1":"val1","field2":"val2"}')
    })

    it('empty object from HGETALL is stringified', () => {
      const result = {}
      const output = serializeOutput(result)
      assert.equal(output, '{}')
    })

    it('empty array from SMEMBERS is stringified', () => {
      const result = []
      const output = serializeOutput(result)
      assert.equal(output, '[]')
    })
  })

  describe('numeric results get JSON.stringified', () => {
    it('number from INCR is stringified', () => {
      const result = 5
      const output = serializeOutput(result)
      assert.equal(output, '5')
    })

    it('number from DEL is stringified', () => {
      const result = 1
      const output = serializeOutput(result)
      assert.equal(output, '1')
    })

    it('number from DBSIZE is stringified', () => {
      const result = 42
      const output = serializeOutput(result)
      assert.equal(output, '42')
    })

    it('zero from EXISTS is stringified', () => {
      const result = 0
      const output = serializeOutput(result)
      assert.equal(output, '0')
    })

    it('negative TTL is stringified', () => {
      const result = -1
      const output = serializeOutput(result)
      assert.equal(output, '-1')
    })
  })

  describe('null result is stringified', () => {
    it('null from GET (missing key) is stringified', () => {
      const result = null
      const output = serializeOutput(result)
      assert.equal(output, 'null')
    })
  })

  describe('no double-encoding', () => {
    it('array is not double-encoded', () => {
      const result = ['a', 'b']
      const output = serializeOutput(result)
      // If double-encoded, it would be: '["a","b"]' wrapped in quotes again
      const parsed = JSON.parse(output)
      assert.ok(Array.isArray(parsed))
      assert.deepEqual(parsed, ['a', 'b'])
    })

    it('object is not double-encoded', () => {
      const result = { k: 'v' }
      const output = serializeOutput(result)
      const parsed = JSON.parse(output)
      assert.equal(typeof parsed, 'object')
      assert.equal(parsed.k, 'v')
    })

    it('string that looks like JSON is not re-stringified', () => {
      // This is the core double-encoding scenario:
      // Redis GET returns a string like '{"a":1}' — it should NOT become '"{\\"a\\":1}"'
      const result = '{"a":1}'
      const output = serializeOutput(result)
      assert.equal(output, '{"a":1}')
      // Verify we can parse it back to an object
      assert.deepEqual(JSON.parse(output), { a: 1 })
    })
  })
})

describe('command info string formatting', () => {
  it('formats info with key', () => {
    const command = 'get'
    const key = 'mykey'
    const output = 'myvalue'
    const info = `${command} ${key ? key + ' ' : ''}→ ${output}`
    assert.equal(info, 'get mykey → myvalue')
  })

  it('formats info without key', () => {
    const command = 'ping'
    const key = ''
    const output = 'PONG'
    const info = `${command} ${key ? key + ' ' : ''}→ ${output}`
    assert.equal(info, 'ping → PONG')
  })
})
