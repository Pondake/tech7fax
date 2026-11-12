// Server-only configuration. Nothing here may ever be exposed to the browser:
// these variables are deliberately not prefixed with VITE_.

export const MIN_PASSWORD_LENGTH = 12
export const MIN_SECRET_LENGTH = 32

function int(value, fallback) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function getConfig(env = process.env) {
  return {
    sitePassword: env.SITE_PASSWORD ?? '',
    sessionSecret: env.SESSION_SECRET ?? '',
    faxEndpoint: (env.FAX_ENDPOINT ?? '').replace(/\/+$/, ''),
    faxApiKey: env.FAX_API_KEY ?? '',
    faxSender: env.FAX_SENDER ?? '',
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    maxBodyBytes: int(env.MAX_BODY_BYTES, 4_000_000),
    maxImages: int(env.MAX_IMAGES, 10),
    sendsPerSessionPerHour: int(env.SENDS_PER_SESSION_PER_HOUR, 10),
    sendsPerIpPerHour: int(env.SENDS_PER_IP_PER_HOUR, 10),
    sendsPerDay: int(env.SENDS_PER_DAY, 30),
    loginAttemptsPerIp: int(env.LOGIN_ATTEMPTS_PER_IP, 10),
    upstreamTimeoutMs: int(env.UPSTREAM_TIMEOUT_MS, 25_000),
  }
}

/** Returns a list of problems that make the auth setup unsafe to use. */
export function authConfigProblems(cfg) {
  const problems = []
  if (cfg.sitePassword.length < MIN_PASSWORD_LENGTH) {
    problems.push(`SITE_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  if (cfg.sessionSecret.length < MIN_SECRET_LENGTH) {
    problems.push(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters`)
  }
  return problems
}
