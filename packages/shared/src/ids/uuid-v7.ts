const UUID_V7_TIMESTAMP_MAX = 0xffffffffffff

export type RandomBytesProvider = (target: Uint8Array) => Uint8Array

function getRandomBytes(target: Uint8Array): Uint8Array {
  const cryptoApi = globalThis.crypto

  if (!cryptoApi?.getRandomValues) {
    throw new Error('crypto.getRandomValues is required to generate UUID v7')
  }

  return cryptoApi.getRandomValues(target)
}

function assertValidTimestamp(timestampMs: number): void {
  if (!Number.isInteger(timestampMs) || timestampMs < 0 || timestampMs > UUID_V7_TIMESTAMP_MAX) {
    throw new Error(`Invalid UUID v7 timestamp: ${timestampMs}`)
  }
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0')
}

export function generateUuidV7(
  timestampMs = Date.now(),
  randomBytesProvider: RandomBytesProvider = getRandomBytes
): string {
  assertValidTimestamp(timestampMs)

  const bytes = randomBytesProvider(new Uint8Array(16))

  bytes[0] = Math.floor(timestampMs / 0x10000000000) & 0xff
  bytes[1] = Math.floor(timestampMs / 0x100000000) & 0xff
  bytes[2] = Math.floor(timestampMs / 0x1000000) & 0xff
  bytes[3] = Math.floor(timestampMs / 0x10000) & 0xff
  bytes[4] = Math.floor(timestampMs / 0x100) & 0xff
  bytes[5] = timestampMs & 0xff

  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, toHex)

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join('')
  ].join('-')
}

export function isUuidV7(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
