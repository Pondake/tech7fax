import { useState, useEffect, useRef, useCallback } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import { Logo } from './components/Logo.jsx'
import { FaxBackground } from './components/FaxBackground.jsx'
import { LockContext } from './lockContext.js'

// The password is checked server-side; the session lives in an HttpOnly cookie
// the page cannot read, so we ask the server whether one exists.
const LOGIN_ERRORS = {
  401: 'Incorrect password',
  429: 'Too many attempts. Try again later.',
}

export function PasswordGate({ children }) {
  // null while the session check is pending.
  const [authed, setAuthed] = useState(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/session', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .catch(() => ({ authenticated: false }))
      .then((data) => {
        if (!cancelled) setAuthed(data.authenticated === true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (authed === false) inputRef.current?.focus()
  }, [authed])

  const lock = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
    setValue('')
    setError('')
    setAuthed(false)
  }, [])

  if (authed) {
    return <LockContext.Provider value={lock}>{children}</LockContext.Provider>
  }

  if (authed === null) {
    return (
      <div className="gate">
        <FaxBackground hero />
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!value || busy) return
    setBusy(true)
    let status = 0
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: value }),
      })
      status = res.status
    } catch {
      /* network error: status stays 0 */
    }
    setBusy(false)
    if (status === 200) {
      setValue('')
      setAuthed(true)
      return
    }
    setError(LOGIN_ERRORS[status] ?? 'Login is unavailable right now')
    setShake(true)
    setValue('')
    setTimeout(() => setShake(false), 400)
  }

  return (
    <div className="gate">
      <FaxBackground hero />
      <form className={`gate-card${shake ? ' gate-card--shake' : ''}`} onSubmit={submit}>
        <div className="gate-logo">
          <Logo size={28} />
          tech7fax
        </div>
        <label className="gate-label" htmlFor="gate-pw">
          <Lock size={13} /> Enter password
        </label>
        <input
          id="gate-pw"
          ref={inputRef}
          type="password"
          className={`gate-input${error ? ' gate-input--error' : ''}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError('')
          }}
          autoComplete="current-password"
          spellCheck={false}
          disabled={busy}
        />
        {error && (
          <div className="gate-error" role="alert">
            <AlertCircle size={12} /> {error}
          </div>
        )}
        <button type="submit" className="gate-submit" disabled={!value || busy}>
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
