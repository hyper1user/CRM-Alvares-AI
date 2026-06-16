/**
 * One-shot script (v1.6.5): fix justify alignment on the `{{ROP_FIRST}}`
 * paragraph in `disposition-template.docx`.
 *
 * Problem: the source paragraph (from Alvares-AI's rozp_Variant_A.docx) has
 * `<w:jc w:val="both"/>` — justified text. Word stretches inter-word spaces
 * to fill the line width. For short {{ROP_FIRST}} lists (1–3 bойців), the
 * last line ends up with grotesque gaps between words.
 *
 * Fix: change justify → left ONLY inside the {{ROP_FIRST}} paragraph,
 * leaving every other paragraph (intro body, etc.) untouched.
 *
 * Idempotent: after the first run the target paragraph no longer contains
 * `<w:jc w:val="both"/>`, so a re-run is a no-op.
 *
 * Boundary detection: 3-step indexOf/lastIndexOf around the unique marker.
 * Same anti-regex pattern as the post-render ACK mutation in v1.6.4
 * (see feedback_docxtemplater_raw_tag.md) — non-greedy regex over multi-
 * paragraph XML eats from the file's FIRST <w:p>, not the nearest one.
 */
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

const docxPath = path.resolve(__dirname, '..', 'resources', 'templates', 'disposition-template.docx')
console.log('[fix-jc] Reading:', docxPath)

const buf = fs.readFileSync(docxPath)
const zip = new PizZip(buf)
let xml = zip.file('word/document.xml').asText()
console.log('[fix-jc] document.xml size:', xml.length)

const ANCHOR = '{{ROP_FIRST}}'
const anchorIdx = xml.indexOf(ANCHOR)
if (anchorIdx < 0) {
  console.error('[fix-jc] FAILED: {{ROP_FIRST}} anchor not found in document.xml')
  process.exit(1)
}

const paraStart = xml.lastIndexOf('<w:p ', anchorIdx)
const paraEnd = xml.indexOf('</w:p>', anchorIdx)
if (paraStart < 0 || paraEnd < 0) {
  console.error('[fix-jc] FAILED: paragraph bounds not found around anchor')
  process.exit(1)
}
const paraEndAfter = paraEnd + '</w:p>'.length

const before = xml.slice(0, paraStart)
const para = xml.slice(paraStart, paraEndAfter)
const after = xml.slice(paraEndAfter)

const JUSTIFY = '<w:jc w:val="both"/>'
const LEFT = '<w:jc w:val="left"/>'

if (!para.includes(JUSTIFY)) {
  console.log('[fix-jc] Paragraph already does not contain justify — nothing to do.')
  return
}
const patched = para.replace(JUSTIFY, LEFT)
const newXml = before + patched + after

zip.file('word/document.xml', newXml)
const out = zip.generate({ type: 'nodebuffer' })
fs.writeFileSync(docxPath, out)
console.log('[fix-jc] Wrote:', docxPath, '(' + out.length + ' bytes)')
console.log('[fix-jc] Replaced 1× ' + JUSTIFY + ' → ' + LEFT + ' inside {{ROP_FIRST}} paragraph.')
