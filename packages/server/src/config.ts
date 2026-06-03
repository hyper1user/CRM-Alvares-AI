export interface ServerConfig {
  host: string
  port: number
  nodeEnv: string
}

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 3780

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT
  }

  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ALVARES_SERVER_PORT: ${value}`)
  }

  return port
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    host: env.ALVARES_SERVER_HOST || DEFAULT_HOST,
    port: parsePort(env.ALVARES_SERVER_PORT),
    nodeEnv: env.NODE_ENV || 'development'
  }
}
