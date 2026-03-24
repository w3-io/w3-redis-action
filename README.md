# W3 Redis Action

Redis key-value store, caching, counters, lists, hashes, and sets for W3 workflows. Shared state between workflows, rate limiting, deduplication, queues, and more.

## Usage

```yaml
- uses: w3-io/w3-redis-action@v1
  with:
    command: set
    url: ${{ secrets.REDIS_URL }}
    key: user:123:name
    value: Alice
    ttl: '3600'
```

## Commands

### Strings
| Command | Description | Inputs |
|---------|-------------|--------|
| `get` | Get value | key |
| `set` | Set value (with optional TTL) | key, value, ttl? |
| `setnx` | Set only if not exists (distributed lock) | key, value, ttl? |
| `getset` | Atomic get-and-replace | key, value |
| `del` | Delete key | key |
| `exists` | Check if key exists (returns 0/1) | key |
| `incr` | Increment counter | key |
| `decr` | Decrement counter | key |
| `incrby` | Increment by amount | key, value |
| `expire` | Set TTL on existing key | key, ttl |
| `ttl` | Get remaining TTL | key |
| `keys` | Find keys matching pattern | pattern |
| `mget` | Get multiple keys | key (comma-separated) |
| `mset` | Set multiple keys | value (key1:val1,key2:val2) |

### Lists (queues)
| Command | Description | Inputs |
|---------|-------------|--------|
| `lpush` | Push to front | key, value |
| `rpush` | Push to back | key, value |
| `lpop` | Pop from front | key |
| `rpop` | Pop from back | key |
| `lrange` | Get range of items | key, start?, stop? |
| `llen` | Get list length | key |

### Hashes (objects)
| Command | Description | Inputs |
|---------|-------------|--------|
| `hget` | Get hash field | key, field |
| `hset` | Set hash field | key, field, value |
| `hdel` | Delete hash field | key, field |
| `hgetall` | Get all fields | key |
| `hincrby` | Increment hash field | key, field, value |

### Sets (unique collections)
| Command | Description | Inputs |
|---------|-------------|--------|
| `sadd` | Add to set | key, value |
| `srem` | Remove from set | key, value |
| `smembers` | List all members | key |
| `sismember` | Check membership (returns 0/1) | key, value |
| `scard` | Get set size | key |

### Pub/Sub
| Command | Description | Inputs |
|---------|-------------|--------|
| `publish` | Publish message to channel | key (channel), value (message) |

### Utility
| Command | Description |
|---------|-------------|
| `ping` | Test connection |
| `dbsize` | Get number of keys |

## Examples

### Rate limiting
```yaml
- uses: w3-io/w3-redis-action@v1
  id: rate
  with:
    command: incr
    url: ${{ secrets.REDIS_URL }}
    key: "ratelimit:${{ inputs.caller }}:${{ steps.time.outputs.minute }}"

- if: fromJSON(steps.rate.outputs.result) > 100
  run: echo "Rate limited" && exit 1
```

### Distributed lock
```yaml
- uses: w3-io/w3-redis-action@v1
  id: lock
  with:
    command: setnx
    url: ${{ secrets.REDIS_URL }}
    key: "lock:process-batch"
    value: ${{ github.run_id }}
    ttl: '300'

- if: steps.lock.outputs.result == '0'
  run: echo "Already locked" && exit 0
```

### Cache with TTL
```yaml
- uses: w3-io/w3-redis-action@v1
  id: cache
  with:
    command: get
    url: ${{ secrets.REDIS_URL }}
    key: "price:ETH"

- if: steps.cache.outputs.result == 'null'
  uses: w3-io/w3-pyth-action@v0
  id: fetch
  with:
    command: get-prices
    symbols: ETH

- if: steps.cache.outputs.result == 'null'
  uses: w3-io/w3-redis-action@v1
  with:
    command: set
    url: ${{ secrets.REDIS_URL }}
    key: "price:ETH"
    value: ${{ steps.fetch.outputs.result }}
    ttl: '60'
```

### Deduplication
```yaml
- uses: w3-io/w3-redis-action@v1
  id: seen
  with:
    command: sismember
    url: ${{ secrets.REDIS_URL }}
    key: "processed-txs"
    value: ${{ inputs.tx_hash }}

- if: steps.seen.outputs.result == '1'
  run: echo "Already processed" && exit 0

- uses: w3-io/w3-redis-action@v1
  with:
    command: sadd
    url: ${{ secrets.REDIS_URL }}
    key: "processed-txs"
    value: ${{ inputs.tx_hash }}
```
