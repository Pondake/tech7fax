// Fixed-window rate limit counters.
//
// With KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN) set, counters
// live in Upstash Redis and are shared by every function instance. Without them they live
// in this instance's memory only, which is a best-effort fallback: serverless instances
// do not share memory, so the limits are per instance.

const PREFIX = 't7f:'
const memory = new Map()
let warned = false

function redisConfig(env = process.env) {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null
}

async function incrRedis({ url, token }, key, ttlSeconds) {
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(ttlSeconds)],
    ]),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`rate limit store responded ${res.status}`)
  const [incr] = await res.json()
  if (typeof incr?.result !== 'number') throw new Error('rate limit store returned no count')
  return incr.result
}

function incrMemory(key, ttlSeconds, now) {
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.expiresAt <= now) memory.delete(k)
  }
  const entry = memory.get(key)
  if (!entry || entry.expiresAt <= now) {
    memory.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 })
    return 1
  }
  entry.count += 1
  return entry.count
}

/**
 * Counts one hit for `name` in the current window of `windowSeconds` and returns the
 * count so far, plus the seconds until the window resets. Throws when the shared store
 * is configured but unreachable, so callers can fail closed.
 */
export async function hit(name, windowSeconds, now = Date.now()) {
  const windowIndex = Math.floor(now / 1000 / windowSeconds)
  const key = `${PREFIX}${name}:${windowIndex}`
  const resetIn = (windowIndex + 1) * windowSeconds - Math.floor(now / 1000)
  const redis = redisConfig()
  if (redis) return { count: await incrRedis(redis, key, windowSeconds), resetIn }
  if (!warned && process.env.VERCEL) {
    warned = true
    console.warn('rate limits use per-instance memory; configure a shared KV store')
  }
  return { count: incrMemory(key, windowSeconds, now), resetIn }
}

/** Test helper: forget all in-memory counters. */
export function resetMemoryStore() {
  memory.clear()
}
