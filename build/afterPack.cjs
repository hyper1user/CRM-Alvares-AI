const path = require('path')
const fs = require('fs')

// Fix: lazystream requires readable-stream@2 with passthrough.js at root
// electron-builder hoists readable-stream@3 which doesn't have passthrough.js
// This hook creates a shim that re-exports PassThrough from v3 API
exports.default = async function afterPack(context) {
  const appOutDir = context.appOutDir
  const unpackedDir = path.join(appOutDir, 'resources', 'app.asar.unpacked')
  const readableStreamDir = path.join(unpackedDir, 'node_modules', 'readable-stream')

  if (!fs.existsSync(readableStreamDir)) return

  const passthroughPath = path.join(readableStreamDir, 'passthrough.js')
  if (!fs.existsSync(passthroughPath)) {
    fs.writeFileSync(
      passthroughPath,
      'module.exports = require(".").PassThrough;\n',
      'utf8'
    )
    console.log('[afterPack] Created readable-stream/passthrough.js shim')
  }

  // Also create duplex.js and transform.js shims if missing (archiver may need them)
  const shimMap = {
    'duplex.js': 'Duplex',
    'transform.js': 'Transform',
    'writable.js': 'Writable'
  }

  for (const [file, cls] of Object.entries(shimMap)) {
    const filePath = path.join(readableStreamDir, file)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `module.exports = require(".").${cls};\n`, 'utf8')
      console.log(`[afterPack] Created readable-stream/${file} shim`)
    }
  }
}
