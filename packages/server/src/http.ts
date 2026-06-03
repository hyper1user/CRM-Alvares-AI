import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { createHealthResponse } from './health.js'

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  })
  response.end(JSON.stringify(body))
}

function route(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url || '/', 'http://localhost')

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, createHealthResponse())
    return
  }

  sendJson(response, 404, {
    ok: false,
    error: 'not_found'
  })
}

export function createHttpServer() {
  return createServer(route)
}
