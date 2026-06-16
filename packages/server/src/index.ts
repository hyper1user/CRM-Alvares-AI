import { loadConfig } from './config.js'
import { createHttpServer } from './http.js'

const config = loadConfig()
const server = createHttpServer()

server.listen(config.port, config.host, () => {
  console.log(`AlvaresAI server listening on http://${config.host}:${config.port}`)
})
