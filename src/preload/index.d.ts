import type { LocalnotesApi } from './index'

declare global {
  interface Window {
    localnotes: LocalnotesApi
  }
}

export {}
