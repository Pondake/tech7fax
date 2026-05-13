import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { Logo } from "./components/Logo.jsx";

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD ?? "";
const STORAGE_KEY = "tech7fax:auth";

const LockContext = createContext(() => {});

export function useLock() {
  return useContext(LockContext);
}

export function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => {
    if (!SITE_PASSWORD) return false;
    try {
      return sessionStorage.getItem(STORAGE_KEY) === SITE_PASSWORD;
    } catch {
      return false;
    }
  });
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!authed) inputRef.current?.focus();
  }, [authed]);

  const lock = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setValue("");
    setError(false);
    setAuthed(false);
  }, []);

  if (authed) {
    return <LockContext.Provider value={lock}>{children}</LockContext.Provider>;
  }

  const submit = (e) => {
    e.preventDefault();
    if (SITE_PASSWORD && value === SITE_PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, SITE_PASSWORD);
      } catch {
        /* ignore */
      }
      setAuthed(true);
    } else {
      setError(true);
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div className="gate">
      <form
        className={`gate-card${shake ? " gate-card--shake" : ""}`}
        onSubmit={submit}
      >
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
          className={`gate-input${error ? " gate-input--error" : ""}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(false);
          }}
          autoComplete="current-password"
          spellCheck={false}
        />
        {error && (
          <div className="gate-error">
            <AlertCircle size={12} /> Incorrect password
          </div>
        )}
        <button type="submit" className="gate-submit" disabled={!value}>
          Unlock
        </button>
      </form>
    </div>
  );
}
