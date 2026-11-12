import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// The __Host- prefix makes the browser refuse the cookie unless it is Secure,
// has Path=/ and no Domain, so it cannot be set or shadowed by a subdomain.
export const SESSION_COOKIE = '__Host-t7f_session'
export const SESSION_TTL_SECONDS = 8 * 60 * 60
const VERSION = 'v1'

function sign(secret, payload) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

/** Constant-time string comparison that does not leak the length of either input. */
export function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest()
  const hb = createHash('sha256').update(String(b)).digest()
  return timingSafeEqual(ha, hb)
}

export function createSession(secret, now = Date.now()) {
  const sid = randomBytes(16).toString('base64url')
  const exp = Math.floor(now / 1000) + SESSION_TTL_SECONDS
  const payload = `${VERSION}.${sid}.${exp}`
  const value = `${payload}.${sign(secret, payload)}`
  const cookie = `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`
  return { sid, exp, cookie }
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim()
  }
  return null
}

/** Returns { sid, exp } for a valid, unexpired session cookie, otherwise null. */
export function readSession(request, secret, now = Date.now()) {
  if (!secret) return null
  const value = readCookie(request, SESSION_COOKIE)
  if (!value) return null
  const parts = value.split('.')
  if (parts.length !== 4 || parts[0] !== VERSION) return null
  const [version, sid, expRaw, sig] = parts
  const expected = sign(secret, `${version}.${sid}.${expRaw}`)
  if (!safeEqual(sig, expected)) return null
  const exp = Number(expRaw)
  if (!Number.isInteger(exp) || exp * 1000 <= now) return null
  return { sid, exp }
}
