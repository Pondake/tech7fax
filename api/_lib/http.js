export class HttpError extends Error {
  constructor(status, code) {
    super(code)
    this.status = status
    this.code = code
  }
}

export function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  })
}

export function errorResponse(status, code, headers) {
  return json(status, { ok: false, error: code }, headers)
}

export function clientIp(request) {
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

/** A state-changing request must come from a page on this same site. */
export function isSameOrigin(request, allowedOrigins = []) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  if (allowedOrigins.includes(origin)) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export function isJson(request) {
  return (request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')
}

/** Reads and parses a JSON body, refusing anything larger than `maxBytes`. */
export async function readJson(request, maxBytes) {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) throw new HttpError(413, 'too_large')
  if (!request.body) throw new HttpError(400, 'empty_body')

  const reader = request.body.getReader()
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => {})
      throw new HttpError(413, 'too_large')
    }
    chunks.push(value)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'invalid_json')
  }
}
