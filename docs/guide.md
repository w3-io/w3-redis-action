# W3 Redis Action Reference Guide

W3 Redis Action provides a Redis key-value store interface for W3 workflows -- strings, counters, lists, hashes, sets, pub/sub, and TTL management. It connects to any Redis instance via a connection URL.

## Quick Start

```yaml
- uses: w3/redis@v1
  with:
    command: set
    url: ${{ secrets.REDIS_URL }}
    key: user:123:name
    value: Alice
    ttl: "3600"

- uses: w3/redis@v1
  id: cached
  with:
    command: get
    url: ${{ secrets.REDIS_URL }}
    key: user:123:name
```

## Commands

### Strings

| Command  | Required Inputs       | Description                                       |
| -------- | --------------------- | ------------------------------------------------- |
| `get`    | `url`, `key`          | Get value by key                                  |
| `set`    | `url`, `key`, `value` | Set value (optional `ttl` in seconds)             |
| `setnx`  | `url`, `key`, `value` | Set only if key does not exist (distributed lock) |
| `getset` | `url`, `key`, `value` | Atomic get-and-replace                            |
| `del`    | `url`, `key`          | Delete a key                                      |
| `exists` | `url`, `key`          | Check if key exists (returns 0 or 1)              |
| `mget`   | `url`, `key`          | Get multiple keys (comma-separated)               |
| `mset`   | `url`, `value`        | Set multiple keys (`key1:val1,key2:val2`)         |
| `keys`   | `url`                 | Find keys matching a glob `pattern` (default `*`) |

### Counters

| Command  | Required Inputs       | Description                   |
| -------- | --------------------- | ----------------------------- |
| `incr`   | `url`, `key`          | Increment by 1                |
| `decr`   | `url`, `key`          | Decrement by 1                |
| `incrby` | `url`, `key`, `value` | Increment by specified amount |

### TTL

| Command  | Required Inputs     | Description                       |
| -------- | ------------------- | --------------------------------- |
| `expire` | `url`, `key`, `ttl` | Set TTL on existing key (seconds) |
| `ttl`    | `url`, `key`        | Get remaining TTL in seconds      |

### Lists

| Command  | Required Inputs       | Description                                |
| -------- | --------------------- | ------------------------------------------ |
| `lpush`  | `url`, `key`, `value` | Push to front of list                      |
| `rpush`  | `url`, `key`, `value` | Push to back of list                       |
| `lpop`   | `url`, `key`          | Pop from front                             |
| `rpop`   | `url`, `key`          | Pop from back                              |
| `lrange` | `url`, `key`          | Get items by index range (`start`, `stop`) |
| `llen`   | `url`, `key`          | Get list length                            |

### Hashes

| Command   | Required Inputs                | Description                    |
| --------- | ------------------------------ | ------------------------------ |
| `hget`    | `url`, `key`, `field`          | Get hash field value           |
| `hset`    | `url`, `key`, `field`, `value` | Set hash field value           |
| `hdel`    | `url`, `key`, `field`          | Delete hash field              |
| `hgetall` | `url`, `key`                   | Get all fields and values      |
| `hincrby` | `url`, `key`, `field`, `value` | Increment hash field by amount |

### Sets

| Command     | Required Inputs       | Description                       |
| ----------- | --------------------- | --------------------------------- |
| `sadd`      | `url`, `key`, `value` | Add member to set                 |
| `srem`      | `url`, `key`, `value` | Remove member                     |
| `smembers`  | `url`, `key`          | List all members                  |
| `sismember` | `url`, `key`, `value` | Check membership (returns 0 or 1) |
| `scard`     | `url`, `key`          | Get set size                      |

### Pub/Sub

| Command   | Required Inputs       | Description                                                 |
| --------- | --------------------- | ----------------------------------------------------------- |
| `publish` | `url`, `key`, `value` | Publish message to channel (`key`=channel, `value`=message) |

### Utility

| Command  | Required Inputs | Description                    |
| -------- | --------------- | ------------------------------ |
| `ping`   | `url`           | Test connection                |
| `dbsize` | `url`           | Get number of keys in database |

## Authentication

Pass a Redis connection URL via the `url` input:

```
redis://host:6379                  # No auth
redis://user:password@host:6379    # Authenticated
rediss://user:password@host:6379   # TLS
```

## Full Workflow Example

```yaml
name: Rate limiter with cache
on: workflow_dispatch

jobs:
  rate-limit:
    runs-on: ubuntu-latest
    steps:
      - name: Increment request counter
        uses: w3/redis@v1
        id: count
        with:
          command: incr
          url: ${{ secrets.REDIS_URL }}
          key: ratelimit:user:42

      - name: Set expiry (1 hour window)
        uses: w3/redis@v1
        with:
          command: expire
          url: ${{ secrets.REDIS_URL }}
          key: ratelimit:user:42
          ttl: "3600"

      - name: Cache API response
        uses: w3/redis@v1
        with:
          command: set
          url: ${{ secrets.REDIS_URL }}
          key: cache:prices:eth
          value: '{"usd": 3250.00, "updated": "2025-01-15T12:00:00Z"}'
          ttl: "300"

      - name: Track user activity
        uses: w3/redis@v1
        with:
          command: lpush
          url: ${{ secrets.REDIS_URL }}
          key: activity:user:42
          value: '{"action": "login", "ts": "2025-01-15T12:00:00Z"}'

      - name: Get recent activity
        uses: w3/redis@v1
        id: activity
        with:
          command: lrange
          url: ${{ secrets.REDIS_URL }}
          key: activity:user:42
          start: "0"
          stop: "9"
```
