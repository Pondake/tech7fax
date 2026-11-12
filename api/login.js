import { authConfigProblems, getConfig } from './_lib/config.js'
import {
  HttpError,
  clientIp,
  errorResponse,
  isJson,
  isSameOrigin,
  json,
  readJson,
} from './_lib/http.js'
import { createSession, safeEqual } from './_lib/session.js'
import { hit } from './_lib/store.js'

const LOGIN_WINDOW_SECONDS = 15 * 60

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(request) {
  const cfg = getConfig()
  const problems = authConfigProblems(cfg)
  if (problems.length) {
    console.error(JSON.stringify({ event: 'login_misconfigured', problems }))
    return errorResponse(503, 'not_configured')
  }
  if (!isSameOrigin(request, cfg.allowedOrigins)) return errorResponse(403, 'bad_origin')
  if (!isJson(request)) return errorResponse(415, 'unsupported_media_type')

  const ip = clientIp(request)
  let attempts
  try {
    attempts = await hit(`login:ip:${ip}`, LOGIN_WINDOW_SECONDS)
  } catch (err) {
    console.error(JSON.stringify({ event: 'rate_limit_store_error', message: err.message }))
    return errorResponse(503, 'unavailable')
  }
  if (attempts.count > cfg.loginAttemptsPerIp) {
    console.warn(JSON.stringify({ event: 'login_rate_limited', ip, count: attempts.count }))
    return errorResponse(429, 'too_many_attempts', { 'Retry-After': String(attempts.resetIn) })
  }

  let body
  try {
    body = await readJson(request, 4096)
  } catch (err) {
    if (err instanceof HttpError) return errorResponse(err.status, err.code)
    throw err
  }

  const password = typeof body?.password === 'string' ? body.password : ''
  if (!password || !safeEqual(password, cfg.sitePassword)) {
    // Slow down guessing; jitter hides timing differences between paths.
    await sleep(800 + Math.floor(Math.random() * 400))
    console.warn(JSON.stringify({ event: 'login_failed', ip, at: new Date().toISOString() }))
    return errorResponse(401, 'invalid_password')
  }

  const session = createSession(cfg.sessionSecret)
  console.log(
    JSON.stringify({
      event: 'login',
      session: session.sid.slice(0, 8),
      ip,
      at: new Date().toISOString(),
    }),
  )
  return json(200, { ok: true, expiresAt: session.exp }, { 'Set-Cookie': session.cookie })
}
