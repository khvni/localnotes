import { contextBridge } from 'electron'

const api = {
  platform: process.platform
}

contextBridge.exposeInMainWorld('localnotes', api)

export type LocalnotesApi = typeof api
