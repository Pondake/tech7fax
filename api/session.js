import { getConfig } from './_lib/config.js'
import { json } from './_lib/http.js'
import { readSession } from './_lib/session.js'

export function GET(request) {
  const session = readSession(request, getConfig().sessionSecret)
  return json(
    200,
    session ? { authenticated: true, expiresAt: session.exp } : { authenticated: false },
  )
}
