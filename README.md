# W3 Redis Action

Redis key-value store, caching, counters, lists, hashes, sets, and pub/sub for W3 workflows.

## Quick Start

```yaml
- uses: w3-io/w3-redis-action@v1
  with:
    command: set
    url: ${{ secrets.REDIS_URL }}
    key: user:123:name
    value: Alice
    ttl: "3600"

- uses: w3-io/w3-redis-action@v1
  id: cached
  with:
    command: get
    url: ${{ secrets.REDIS_URL }}
    key: user:123:name
```

## Commands

### Strings

| Command  | Description                                       |
| -------- | ------------------------------------------------- |
| `get`    | Get value by key                                  |
| `set`    | Set value (with optional TTL)                     |
| `setnx`  | Set only if key does not exist (distributed lock) |
| `getset` | Atomic get-and-replace                            |
| `del`    | Delete key                                        |
| `exists` | Check if key exists (returns 0/1)                 |
| `incr`   | Increment counter by 1                            |
| `decr`   | Decrement counter by 1                            |
| `incrby` | Increment by specified amount                     |
| `expire` | Set TTL on existing key                           |
| `ttl`    | Get remaining TTL in seconds                      |
| `keys`   | Find keys matching a glob pattern                 |
| `mget`   | Get multiple keys (comma-separated)               |
| `mset`   | Set multiple keys (`key1:val1,key2:val2`)         |

### Lists

| Command  | Description                 |
| -------- | --------------------------- |
| `lpush`  | Push value to front of list |
| `rpush`  | Push value to back of list  |
| `lpop`   | Pop from front of list      |
| `rpop`   | Pop from back of list       |
| `lrange` | Get range of items by index |
| `llen`   | Get list length             |

### Hashes

| Command   | Description                    |
| --------- | ------------------------------ |
| `hget`    | Get hash field value           |
| `hset`    | Set hash field value           |
| `hdel`    | Delete hash field              |
| `hgetall` | Get all fields and values      |
| `hincrby` | Increment hash field by amount |

### Sets

| Command     | Description                    |
| ----------- | ------------------------------ |
| `sadd`      | Add member to set              |
| `srem`      | Remove member from set         |
| `smembers`  | List all members               |
| `sismember` | Check membership (returns 0/1) |
| `scard`     | Get set size                   |

### Pub/Sub

| Command   | Description                                             |
| --------- | ------------------------------------------------------- |
| `publish` | Publish message to channel (key=channel, value=message) |

### Utility

| Command  | Description                    |
| -------- | ------------------------------ |
| `ping`   | Test connection                |
| `dbsize` | Get number of keys in database |

## Inputs

| Name      | Required | Default | Description                                          |
| --------- | -------- | ------- | ---------------------------------------------------- |
| `command` | Yes      |         | Operation to perform                                 |
| `url`     | Yes      |         | Redis connection URL (`redis://user:pass@host:port`) |
| `key`     | No       |         | Redis key                                            |
| `value`   | No       |         | Value for set/push/add operations                    |
| `field`   | No       |         | Hash field name (for hget/hset/hdel/hincrby)         |
| `ttl`     | No       |         | TTL in seconds                                       |
| `start`   | No       | `0`     | Start index for lrange                               |
| `stop`    | No       | `-1`    | Stop index for lrange (-1 = all)                     |
| `pattern` | No       | `*`     | Glob pattern for keys command                        |

## Outputs

| Name     | Description                   |
| -------- | ----------------------------- |
| `result` | Command result as JSON string |

## Authentication

Pass a Redis connection URL via the `url` input. Supports standalone and authenticated connections:

```
redis://host:6379
redis://user:password@host:6379
rediss://user:password@host:6379   # TLS
```
