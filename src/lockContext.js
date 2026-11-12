import { createContext, useContext } from 'react'

export const LockContext = createContext(() => {})

export function useLock() {
  return useContext(LockContext)
}
