import { json } from './_lib/http.js'
import { clearSessionCookie } from './_lib/session.js'

export function POST() {
  return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookie() })
}
