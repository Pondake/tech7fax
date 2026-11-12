import { getConfig } from './_lib/config.js'
import {
  HttpError,
  clientIp,
  errorResponse,
  isJson,
  isSameOrigin,
  json,
  readJson,
} from './_lib/http.js'
import { readSession } from './_lib/session.js'
import { hit } from './_lib/store.js'

const HOUR = 60 * 60
const DAY = 24 * HOUR

function log(event, fields) {
  console.log(JSON.stringify({ event, at: new Date().toISOString(), ...fields }))
}

/**
 * Checks each limit in order and counts a hit only once the previous one passed,
 * so a request refused by one limit does not use up the next.
 */
async function checkLimits(limits) {
  for (const { name, window, max } of limits) {
    const { count, resetIn } = await hit(name, window)
    if (count > max) return { name, resetIn }
  }
  return null
}

export async function POST(request) {
  const cfg = getConfig()
  if (!cfg.sessionSecret || !cfg.faxEndpoint) {
    console.error(JSON.stringify({ event: 'send_misconfigured' }))
    return errorResponse(503, 'not_configured')
  }
  if (!isSameOrigin(request, cfg.allowedOrigins)) return errorResponse(403, 'bad_origin')

  const session = readSession(request, cfg.sessionSecret)
  if (!session) return errorResponse(401, 'unauthorized')
  if (!isJson(request)) return errorResponse(415, 'unsupported_media_type')

  let body
  try {
    body = await readJson(request, cfg.maxBodyBytes)
  } catch (err) {
    if (err instanceof HttpError) return errorResponse(err.status, err.code)
    throw err
  }

  const content = body?.content
  if (typeof content !== 'string' || !content.trim()) return errorResponse(400, 'empty_content')
  const images = (content.match(/<img\b/gi) ?? []).length
  if (images > cfg.maxImages) return errorResponse(413, 'too_many_images')

  const ip = clientIp(request)
  const who = { session: session.sid.slice(0, 8), ip }
  const bytes = Buffer.byteLength(content, 'utf8')

  let limited
  try {
    limited = await checkLimits([
      { name: `send:session:${session.sid}`, window: HOUR, max: cfg.sendsPerSessionPerHour },
      { name: `send:ip:${ip}`, window: HOUR, max: cfg.sendsPerIpPerHour },
      { name: 'send:all', window: DAY, max: cfg.sendsPerDay },
    ])
  } catch (err) {
    console.error(JSON.stringify({ event: 'rate_limit_store_error', message: err.message }))
    return errorResponse(503, 'unavailable')
  }
  if (limited) {
    log('send_rate_limited', { ...who, limit: limited.name.split(':')[1], bytes })
    return errorResponse(429, 'rate_limited', { 'Retry-After': String(limited.resetIn) })
  }

  let upstream
  try {
    upstream = await fetch(`${cfg.faxEndpoint}/html`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.faxApiKey ? { Authorization: `Bearer ${cfg.faxApiKey}` } : {}),
      },
      body: JSON.stringify({ content, sender: cfg.faxSender }),
      signal: AbortSignal.timeout(cfg.upstreamTimeoutMs),
    })
  } catch (err) {
    log('send_failed', { ...who, bytes, images, reason: err.name })
    return errorResponse(502, 'upstream_unreachable')
  }
  // Never pass the upstream body through to the browser.
  await upstream.body?.cancel().catch(() => {})

  if (!upstream.ok) {
    log('send_failed', { ...who, bytes, images, upstreamStatus: upstream.status })
    return errorResponse(502, 'upstream_error')
  }
  log('fax_sent', { ...who, bytes, images })
  return json(200, { ok: true })
}
