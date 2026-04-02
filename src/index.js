import { createCommandRouter, setJsonOutput, handleError } from '@w3-io/action-core'
import * as core from '@actions/core'
import Redis from 'ioredis'

let redis

const router = createCommandRouter({
  // --- String operations ---
  'get': async () => {
    await connect()
    setJsonOutput('result', await redis.get(key()))
  },
  'set': async () => {
    await connect()
    const k = key(), v = value(), t = ttl()
    const result = t
      ? await redis.set(k, v, 'EX', parseInt(t, 10))
      : await redis.set(k, v)
    setJsonOutput('result', result)
  },
  'setnx': async () => {
    await connect()
    const k = key(), v = value(), t = ttl()
    const result = await redis.setnx(k, v)
    if (result === 1 && t) {
      await redis.expire(k, parseInt(t, 10))
    }
    setJsonOutput('result', result)
  },
  'getset': async () => {
    await connect()
    setJsonOutput('result', await redis.getset(key(), value()))
  },
  'del': async () => {
    await connect()
    setJsonOutput('result', await redis.del(key()))
  },
  'exists': async () => {
    await connect()
    setJsonOutput('result', await redis.exists(key()))
  },
  'incr': async () => {
    await connect()
    setJsonOutput('result', await redis.incr(key()))
  },
  'decr': async () => {
    await connect()
    setJsonOutput('result', await redis.decr(key()))
  },
  'incrby': async () => {
    await connect()
    setJsonOutput('result', await redis.incrby(key(), parseInt(value(), 10)))
  },
  'expire': async () => {
    await connect()
    setJsonOutput('result', await redis.expire(key(), parseInt(ttl(), 10)))
  },
  'ttl': async () => {
    await connect()
    setJsonOutput('result', await redis.ttl(key()))
  },
  'keys': async () => {
    await connect()
    const pattern = core.getInput('pattern') || '*'
    setJsonOutput('result', await redis.keys(pattern))
  },
  'mget': async () => {
    await connect()
    const keys = key().split(',').map((k) => k.trim()).filter(Boolean)
    setJsonOutput('result', await redis.mget(...keys))
  },
  'mset': async () => {
    await connect()
    // value format: "key1:val1,key2:val2"
    const pairs = value().split(',').map((p) => p.trim())
    const args = []
    for (const pair of pairs) {
      const [k, ...rest] = pair.split(':')
      args.push(k.trim(), rest.join(':').trim())
    }
    setJsonOutput('result', await redis.mset(...args))
  },

  // --- List operations ---
  'lpush': async () => {
    await connect()
    setJsonOutput('result', await redis.lpush(key(), value()))
  },
  'rpush': async () => {
    await connect()
    setJsonOutput('result', await redis.rpush(key(), value()))
  },
  'lpop': async () => {
    await connect()
    setJsonOutput('result', await redis.lpop(key()))
  },
  'rpop': async () => {
    await connect()
    setJsonOutput('result', await redis.rpop(key()))
  },
  'lrange': async () => {
    await connect()
    const start = parseInt(core.getInput('start') || '0', 10)
    const stop = parseInt(core.getInput('stop') || '-1', 10)
    setJsonOutput('result', await redis.lrange(key(), start, stop))
  },
  'llen': async () => {
    await connect()
    setJsonOutput('result', await redis.llen(key()))
  },

  // --- Hash operations ---
  'hget': async () => {
    await connect()
    setJsonOutput('result', await redis.hget(key(), field()))
  },
  'hset': async () => {
    await connect()
    setJsonOutput('result', await redis.hset(key(), field(), value()))
  },
  'hdel': async () => {
    await connect()
    setJsonOutput('result', await redis.hdel(key(), field()))
  },
  'hgetall': async () => {
    await connect()
    setJsonOutput('result', await redis.hgetall(key()))
  },
  'hincrby': async () => {
    await connect()
    setJsonOutput('result', await redis.hincrby(key(), field(), parseInt(value(), 10)))
  },

  // --- Set operations ---
  'sadd': async () => {
    await connect()
    setJsonOutput('result', await redis.sadd(key(), value()))
  },
  'srem': async () => {
    await connect()
    setJsonOutput('result', await redis.srem(key(), value()))
  },
  'smembers': async () => {
    await connect()
    setJsonOutput('result', await redis.smembers(key()))
  },
  'sismember': async () => {
    await connect()
    setJsonOutput('result', await redis.sismember(key(), value()))
  },
  'scard': async () => {
    await connect()
    setJsonOutput('result', await redis.scard(key()))
  },

  // --- Pub/Sub (publish only) ---
  'publish': async () => {
    await connect()
    setJsonOutput('result', await redis.publish(key(), value()))
  },

  // --- Utility ---
  'ping': async () => {
    await connect()
    setJsonOutput('result', await redis.ping())
  },
  'dbsize': async () => {
    await connect()
    setJsonOutput('result', await redis.dbsize())
  },
  'flushdb': async () => {
    await connect()
    setJsonOutput('result', await redis.flushdb())
  },
})

function key() { return core.getInput('key') || '' }
function value() { return core.getInput('value') || '' }
function field() { return core.getInput('field') || '' }
function ttl() { return core.getInput('ttl') || '' }

async function connect() {
  const url = core.getInput('url', { required: true })
  redis = new Redis(url, {
    connectTimeout: 10000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  })
  await redis.connect()
}

router().finally(() => {
  if (redis) redis.disconnect()
})
