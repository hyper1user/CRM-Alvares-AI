/**
 * v1.6.1 hotfix#2: one-shot patch для disposition-template.docx.
 * Замінює `{{ACK_LIST}}` на `{{@ackListXml}}` у word/document.xml.
 *
 * Чому: `@`-prefix у docxtemplater сигналізує raw XML insertion (block-level)
 * — нам треба вставляти повний `<w:p>` з `<w:tab/>` runs замість plain text,
 * щоб шаблонний tab-stop з leader=underscore спрацював.
 *
 * Запуск (один раз): `node build/patch-disposition-ack-tag.cjs`. Скрипт
 * idempotent: якщо тег вже патчений — не робить нічого.
 */
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

const TEMPLATE_PATH = path.join(__dirname, '..', 'resources', 'templates', 'disposition-template.docx')

const buf = fs.readFileSync(TEMPLATE_PATH)
const zip = new PizZip(buf)
const docFile = zip.file('word/document.xml')
if (!docFile) {
  console.error('ERROR: word/document.xml not found in', TEMPLATE_PATH)
  process.exit(1)
}

const xml = docFile.asText()
if (xml.includes('{{@ackListXml}}')) {
  console.log('Already patched: {{@ackListXml}} present. No-op.')
  process.exit(0)
}
if (!xml.includes('{{ACK_LIST}}')) {
  console.error('ERROR: {{ACK_LIST}} not found and {{@ackListXml}} missing. Manual inspection needed.')
  process.exit(2)
}

const patched = xml.replace('{{ACK_LIST}}', '{{@ackListXml}}')
zip.file('word/document.xml', patched)
fs.writeFileSync(TEMPLATE_PATH, zip.generate({ type: 'nodebuffer' }))
console.log('Patched:', TEMPLATE_PATH)
console.log('  {{ACK_LIST}} → {{@ackListXml}}')
