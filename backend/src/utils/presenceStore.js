// utils/presenceStore.js
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

// same TTL you used before
const TTL_MS = 30_000;

const zKey = (roomKey) => `presence:z:${roomKey}`;   // ZSET: usernames scored by lastSeen
const hKey = (roomKey) => `presence:h:${roomKey}`;   // HASH: username -> role

async function heartbeat({ roomKey, username, role, now = Date.now() }) {
  const z = zKey(roomKey);
  const h = hKey(roomKey);
  const cutoff = now - TTL_MS;

  // 1) upsert my lastSeen + role
  // 2) find expired users
  const tx = redis.multi()
    .zadd(z, now, username)
    .hset(h, username, role)
    .zrangebyscore(z, 0, cutoff); // expired usernames
  const [, , expired] = (await tx.exec()).map(x => x[1]);

  // prune expired (from both ZSET + HASH)
  if (expired.length) {
    const tx2 = redis.multi().zrem(z, ...expired).hdel(h, ...expired);
    await tx2.exec();
  }

  // list current users + roles
  const users = await redis.zrange(z, 0, -1);
  if (!users.length) return [];
  const roles = await redis.hmget(h, ...users);
  return users.map((u, i) => ({ username: u, role: roles[i] || "User" }));
}

async function list(roomKey) {
  const users = await redis.zrange(zKey(roomKey), 0, -1);
  if (!users.length) return [];
  const roles = await redis.hmget(hKey(roomKey), ...users);
  return users.map((u, i) => ({ username: u, role: roles[i] || "User" }));
}

async function leave({ roomKey, username }) {
  const z = zKey(roomKey);
  const h = hKey(roomKey);
  const tx = redis.multi().zrem(z, username).hdel(h, username).zcard(z);
  const [, , remaining] = (await tx.exec()).map(x => x[1]);
  if (remaining === 0) {
    await redis.del(z, h);
  }
}

module.exports = { heartbeat, list, leave, TTL_MS, redis };
