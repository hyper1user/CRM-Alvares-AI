import type { IpcChannel } from '@alvares/shared/ipc-channels'

export interface HealthResponse {
  ok: true
  service: 'alvares-server'
  phase: 'phase-0'
  sharedContract: 'available'
  timestamp: string
}

const contractProbe: IpcChannel = 'app:version'

export function createHealthResponse(now = new Date()): HealthResponse {
  void contractProbe

  return {
    ok: true,
    service: 'alvares-server',
    phase: 'phase-0',
    sharedContract: 'available',
    timestamp: now.toISOString()
  }
}
