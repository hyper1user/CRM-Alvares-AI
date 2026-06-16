/**
 * One-shot script (v1.7.0): transform Alvares-AI rozp_Variant_B..G.docx into
 * docxtemplater-compatible templates with `{{...}}` delimiters.
 *
 * Reads:  шаблони/alvares-source/rozp_Variant_{B..G}.docx (gitignored source).
 * Writes: resources/templates/disposition-Variant_{B..G}.docx.
 *
 * Operations per file:
 *   1. <<№*>>             → №{{dispositionNumber}}
 *   2. <<від DD.MM.YYYY р.>> → від {{dispositionDate}} р.
 *   3. <<Дата_виконання>>  → {{executionDate}}
 *   4. {{IF_ROP}}          → {{#hasRop}}
 *   5. {{/IF_ROP}}         → {{/hasRop}}
 *   6. {{ROP_FIRST}} paragraph: <w:jc w:val="both"/> → <w:jc w:val="left"/>
 *      (idempotent, bounded by lastIndexOf/indexOf around {{ROP_FIRST}}).
 *
 * Note: Variant_A is already transformed (renamed from disposition-template.docx
 * to disposition-Variant_A.docx in v1.7.0). This script handles B-G only.
 *
 * docxtemplater автоматично сполучає split-runs у XML при парсингу тегів,
 * тож не треба попередньо «склеювати» {{населений_пункт}} коли Word розбив
 * його на 3 runs.
 */
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

const SRC_DIR = path.resolve(__dirname, '..', 'шаблони', 'alvares-source')
const DST_DIR = path.resolve(__dirname, '..', 'resources', 'templates')
const VARIANTS = ['B', 'C', 'D', 'E', 'F', 'G']

const replacements = [
  [/&lt;&lt;№\*&gt;&gt;/g, '№{{dispositionNumber}}'],
  [/&lt;&lt;від \d{2}\.\d{2}\.\d{4} р\.&gt;&gt;/g, 'від {{dispositionDate}} р.'],
  [/&lt;&lt;Дата_виконання&gt;&gt;/g, '{{executionDate}}'],
  [/\{\{IF_ROP\}\}/g, '{{#hasRop}}'],
  [/\{\{\/IF_ROP\}\}/g, '{{/hasRop}}']
]

function fixRopFirstJustify(xml) {
  const anchor = xml.indexOf('{{ROP_FIRST}}')
  if (anchor < 0) return { xml, fixed: false }
  const paraStart = xml.lastIndexOf('<w:p ', anchor)
  const paraEnd = xml.indexOf('</w:p>', anchor)
  if (paraStart < 0 || paraEnd < 0) return { xml, fixed: false }
  const paraEndAfter = paraEnd + '</w:p>'.length
  const para = xml.slice(paraStart, paraEndAfter)
  const JUSTIFY = '<w:jc w:val="both"/>'
  if (!para.includes(JUSTIFY)) return { xml, fixed: false }
  const patched = para.replace(JUSTIFY, '<w:jc w:val="left"/>')
  return { xml: xml.slice(0, paraStart) + patched + xml.slice(paraEndAfter), fixed: true }
}

function transformOne(variant) {
  const srcPath = path.join(SRC_DIR, `rozp_Variant_${variant}.docx`)
  const dstPath = path.join(DST_DIR, `disposition-Variant_${variant}.docx`)
  if (!fs.existsSync(srcPath)) {
    console.warn(`[skip ${variant}] source not found: ${srcPath}`)
    return
  }
  const buf = fs.readFileSync(srcPath)
  const zip = new PizZip(buf)
  let xml = zip.file('word/document.xml').asText()
  const origSize = xml.length

  let totalReplaced = 0
  for (const [re, rep] of replacements) {
    const matches = xml.match(re) || []
    if (matches.length === 0) continue
    totalReplaced += matches.length
    xml = xml.replace(re, rep)
  }

  const { xml: xml2, fixed } = fixRopFirstJustify(xml)
  xml = xml2

  zip.file('word/document.xml', xml)
  const out = zip.generate({ type: 'nodebuffer' })
  fs.writeFileSync(dstPath, out)
  console.log(
    `[Variant ${variant}] ${origSize} → ${xml.length} bytes, ` +
    `${totalReplaced} placeholder rewrites, justify-fix: ${fixed ? 'yes' : 'no (no ROP_FIRST paragraph)'}`
  )
}

console.log('[transform-variants] Source:', SRC_DIR)
console.log('[transform-variants] Dest:', DST_DIR)
for (const v of VARIANTS) transformOne(v)
console.log('[transform-variants] Done.')
