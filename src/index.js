const core = require("@actions/core");
const Redis = require("ioredis");

async function run() {
  let redis;
  try {
    const command = core.getInput("command", { required: true }).toLowerCase();
    const url = core.getInput("url", { required: true });
    const key = core.getInput("key") || "";
    const value = core.getInput("value") || "";
    const field = core.getInput("field") || "";
    const ttl = core.getInput("ttl") || "";
    const start = parseInt(core.getInput("start") || "0", 10);
    const stop = parseInt(core.getInput("stop") || "-1", 10);
    const pattern = core.getInput("pattern") || "*";

    redis = new Redis(url, {
      connectTimeout: 10000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();

    let result;

    switch (command) {
      // --- String operations ---
      case "get":
        result = await redis.get(key);
        break;

      case "set":
        if (ttl) {
          result = await redis.set(key, value, "EX", parseInt(ttl, 10));
        } else {
          result = await redis.set(key, value);
        }
        break;

      case "setnx":
        result = await redis.setnx(key, value);
        if (result === 1 && ttl) {
          await redis.expire(key, parseInt(ttl, 10));
        }
        break;

      case "getset":
        result = await redis.getset(key, value);
        break;

      case "del":
        result = await redis.del(key);
        break;

      case "exists":
        result = await redis.exists(key);
        break;

      case "incr":
        result = await redis.incr(key);
        break;

      case "decr":
        result = await redis.decr(key);
        break;

      case "incrby":
        result = await redis.incrby(key, parseInt(value, 10));
        break;

      case "expire":
        result = await redis.expire(key, parseInt(ttl, 10));
        break;

      case "ttl":
        result = await redis.ttl(key);
        break;

      case "keys":
        result = await redis.keys(pattern);
        break;

      case "mget": {
        const keys = key.split(",").map((k) => k.trim()).filter(Boolean);
        result = await redis.mget(...keys);
        break;
      }

      case "mset": {
        // value format: "key1:val1,key2:val2"
        const pairs = value.split(",").map((p) => p.trim());
        const args = [];
        for (const pair of pairs) {
          const [k, ...rest] = pair.split(":");
          args.push(k.trim(), rest.join(":").trim());
        }
        result = await redis.mset(...args);
        break;
      }

      // --- List operations ---
      case "lpush":
        result = await redis.lpush(key, value);
        break;

      case "rpush":
        result = await redis.rpush(key, value);
        break;

      case "lpop":
        result = await redis.lpop(key);
        break;

      case "rpop":
        result = await redis.rpop(key);
        break;

      case "lrange":
        result = await redis.lrange(key, start, stop);
        break;

      case "llen":
        result = await redis.llen(key);
        break;

      // --- Hash operations ---
      case "hget":
        result = await redis.hget(key, field);
        break;

      case "hset":
        result = await redis.hset(key, field, value);
        break;

      case "hdel":
        result = await redis.hdel(key, field);
        break;

      case "hgetall":
        result = await redis.hgetall(key);
        break;

      case "hincrby":
        result = await redis.hincrby(key, field, parseInt(value, 10));
        break;

      // --- Set operations ---
      case "sadd":
        result = await redis.sadd(key, value);
        break;

      case "srem":
        result = await redis.srem(key, value);
        break;

      case "smembers":
        result = await redis.smembers(key);
        break;

      case "sismember":
        result = await redis.sismember(key, value);
        break;

      case "scard":
        result = await redis.scard(key);
        break;

      // --- Pub/Sub (publish only) ---
      case "publish":
        result = await redis.publish(key, value);
        break;

      // --- Utility ---
      case "ping":
        result = await redis.ping();
        break;

      case "dbsize":
        result = await redis.dbsize();
        break;

      case "flushdb":
        result = await redis.flushdb();
        break;

      default:
        throw new Error(
          `Unknown command: ${command}. Run with command=help for available commands.`,
        );
    }

    const output = typeof result === "string" ? result : JSON.stringify(result);
    core.setOutput("result", output);
    core.info(`${command} ${key ? key + " " : ""}→ ${output}`);
  } catch (error) {
    core.setFailed(error.message);
  } finally {
    if (redis) {
      redis.disconnect();
    }
  }
}

run();
