// Tests for the api/ functions. They run against a mock fax upstream on 127.0.0.1 only.
// Never point these tests at the real fax endpoint: a real device prints faxes.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { after, before, beforeEach, describe, test } from 'node:test'

const ORIGIN = 'https://app.example'
const PASSWORD = 'correct horse battery staple'
const SECRET = 'x'.repeat(48)

const upstream = { requests: [], status: 200 }
let server

const BASE_ENV = {
  SITE_PASSWORD: PASSWORD,
  SESSION_SECRET: SECRET,
  FAX_API_KEY: 'mock-key',
  FAX_SENDER: 'Test Sender',
  MAX_BODY_BYTES: '20000',
  MAX_IMAGES: '3',
  SENDS_PER_SESSION_PER_HOUR: '100',
  SENDS_PER_IP_PER_HOUR: '100',
  SENDS_PER_DAY: '100',
  LOGIN_ATTEMPTS_PER_IP: '100',
}

for (const key of [
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'ALLOWED_ORIGINS',
  'VERCEL',
]) {
  delete process.env[key]
}

const { POST: login } = await import('../api/login.js')
const { POST: logout } = await import('../api/logout.js')
const { GET: session } = await import('../api/session.js')
const { POST: send } = await import('../api/send.js')
const { resetMemoryStore } = await import('../api/_lib/store.js')
const { createSession } = await import('../api/_lib/session.js')

function request(path, { method = 'POST', body, headers = {}, rawBody } = {}) {
  const init = {
    method,
    headers: { origin: ORIGIN, 'x-real-ip': '203.0.113.7', ...headers },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers['content-type'] ??= 'application/json'
  }
  if (rawBody !== undefined) {
    init.body = rawBody
    init.duplex = 'half'
  }
  return new Request(`${ORIGIN}${path}`, init)
}

async function loginCookie() {
  const res = await login(request('/api/login', { body: { password: PASSWORD } }))
  assert.equal(res.status, 200)
  return res.headers.get('set-cookie').split(';')[0]
}

const sendWith = (cookie, body, headers = {}) =>
  send(request('/api/send', { body, headers: { cookie, ...headers } }))

before(async () => {
  server = createServer((req, res) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => {
      upstream.requests.push({ url: req.url, headers: req.headers, body: data })
      res.writeHead(upstream.status, { 'content-type': 'text/plain' })
      res.end('UPSTREAM_INTERNAL_DETAILS')
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  BASE_ENV.FAX_ENDPOINT = `http://127.0.0.1:${server.address().port}`
})

after(() => server.close())

beforeEach(() => {
  Object.assign(process.env, BASE_ENV)
  assert.match(process.env.FAX_ENDPOINT, /^http:\/\/127\.0\.0\.1:\d+$/)
  resetMemoryStore()
  upstream.requests = []
  upstream.status = 200
})

describe('login', () => {
  test('rejects a wrong password with 401 and no cookie', async () => {
    const res = await login(request('/api/login', { body: { password: 'nope' } }))
    assert.equal(res.status, 401)
    assert.equal(res.headers.get('set-cookie'), null)
  })

  test('sets a hardened session cookie for the right password', async () => {
    const res = await login(request('/api/login', { body: { password: PASSWORD } }))
    assert.equal(res.status, 200)
    const cookie = res.headers.get('set-cookie')
    assert.match(cookie, /^__Host-t7f_session=/)
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=28800']) {
      assert.ok(cookie.includes(flag), `cookie has ${flag}`)
    }
    assert.ok(!cookie.includes(PASSWORD))
  })

  test('refuses a cross-site origin', async () => {
    const res = await login(
      request('/api/login', {
        body: { password: PASSWORD },
        headers: { origin: 'https://evil.example' },
      }),
    )
    assert.equal(res.status, 403)
  })

  test('rate limits attempts per IP with 429', async () => {
    process.env.LOGIN_ATTEMPTS_PER_IP = '3'
    for (let i = 0; i < 3; i++) await loginCookie()
    const res = await login(request('/api/login', { body: { password: PASSWORD } }))
    assert.equal(res.status, 429)
    assert.ok(Number(res.headers.get('retry-after')) > 0)
  })

  test('fails closed when the password or secret is too short', async () => {
    process.env.SITE_PASSWORD = 'abcd'
    let res = await login(request('/api/login', { body: { password: 'abcd' } }))
    assert.equal(res.status, 503)
    process.env.SITE_PASSWORD = PASSWORD
    process.env.SESSION_SECRET = 'short'
    res = await login(request('/api/login', { body: { password: PASSWORD } }))
    assert.equal(res.status, 503)
  })
})

describe('session and logout', () => {
  test('reports a valid session', async () => {
    const cookie = await loginCookie()
    const res = await session(request('/api/session', { method: 'GET', headers: { cookie } }))
    assert.equal((await res.json()).authenticated, true)
  })

  test('rejects tampered, foreign and expired cookies', async () => {
    const cookie = await loginCookie()
    const forged = createSession('y'.repeat(48)).cookie.split(';')[0]
    const expired = createSession(SECRET, Date.now() - 9 * 60 * 60 * 1000).cookie.split(';')[0]
    for (const c of [cookie.slice(0, -2) + 'AA', forged, expired, '__Host-t7f_session=v1.a.b.c']) {
      const res = await session(request('/api/session', { method: 'GET', headers: { cookie: c } }))
      assert.equal((await res.json()).authenticated, false, c)
    }
  })

  test('logout clears the cookie', async () => {
    const res = await logout(request('/api/logout'))
    assert.match(res.headers.get('set-cookie'), /^__Host-t7f_session=; .*Max-Age=0/)
  })
})

describe('send', () => {
  test('returns 401 without a session and never calls upstream', async () => {
    const res = await sendWith(undefined, { content: '<p>hi</p>' })
    assert.equal(res.status, 401)
    assert.equal(upstream.requests.length, 0)
  })

  test('returns 403 for a cross-site origin even with a session', async () => {
    const cookie = await loginCookie()
    const res = await sendWith(cookie, { content: '<p>hi</p>' }, { origin: 'https://evil.example' })
    assert.equal(res.status, 403)
    assert.equal(upstream.requests.length, 0)
  })

  test('returns 413 for an oversized body (declared and streamed)', async () => {
    const cookie = await loginCookie()
    const big = { content: 'x'.repeat(30000) }
    let res = await sendWith(cookie, big)
    assert.equal(res.status, 413)

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify(big)))
        controller.close()
      },
    })
    res = await send(
      request('/api/send', {
        rawBody: stream,
        headers: { cookie, 'content-type': 'application/json' },
      }),
    )
    assert.equal(res.status, 413)
    assert.equal(upstream.requests.length, 0)
  })

  test('returns 413 for too many images', async () => {
    const cookie = await loginCookie()
    const res = await sendWith(cookie, { content: '<img src="a">'.repeat(4) })
    assert.equal(res.status, 413)
    assert.equal((await res.json()).error, 'too_many_images')
  })

  test('returns 400 for empty content', async () => {
    const cookie = await loginCookie()
    const res = await sendWith(cookie, { content: '   ' })
    assert.equal(res.status, 400)
  })

  test('forwards to the mock upstream with server-side key and sender', async () => {
    const cookie = await loginCookie()
    const res = await sendWith(cookie, { content: '<p>hello</p>', sender: 'Spoofed' })
    assert.equal(res.status, 200)
    const text = await res.text()
    assert.deepEqual(JSON.parse(text), { ok: true })
    assert.ok(!text.includes('UPSTREAM_INTERNAL_DETAILS'))

    assert.equal(upstream.requests.length, 1)
    const [req] = upstream.requests
    assert.equal(req.url, '/html')
    assert.equal(req.headers.authorization, 'Bearer mock-key')
    assert.deepEqual(JSON.parse(req.body), { content: '<p>hello</p>', sender: 'Test Sender' })
  })

  test('hides the upstream body when upstream fails', async () => {
    upstream.status = 500
    const cookie = await loginCookie()
    const res = await sendWith(cookie, { content: '<p>hello</p>' })
    assert.equal(res.status, 502)
    const text = await res.text()
    assert.ok(!text.includes('UPSTREAM_INTERNAL_DETAILS'))
  })

  test('returns 429 over the per-session limit', async () => {
    process.env.SENDS_PER_SESSION_PER_HOUR = '2'
    const cookie = await loginCookie()
    for (let i = 0; i < 2; i++) {
      assert.equal((await sendWith(cookie, { content: '<p>x</p>' })).status, 200)
    }
    const res = await sendWith(cookie, { content: '<p>x</p>' })
    assert.equal(res.status, 429)
    assert.equal(upstream.requests.length, 2)
  })

  test('returns 429 over the global daily cap across sessions', async () => {
    process.env.SENDS_PER_DAY = '2'
    for (let i = 0; i < 2; i++) {
      const cookie = await loginCookie()
      assert.equal((await sendWith(cookie, { content: '<p>x</p>' })).status, 200)
    }
    const fresh = await loginCookie()
    const res = await sendWith(fresh, { content: '<p>x</p>' })
    assert.equal(res.status, 429)
    assert.equal(upstream.requests.length, 2)
  })
})
