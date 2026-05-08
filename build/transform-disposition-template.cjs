/**
 * One-shot script: transform Alvares-AI rozp_Variant_A.docx into a docxtemplater
 * template with `{{...}}` delimiters (custom, registered in disposition-builder.ts).
 *
 * Reads:  resources/templates/disposition-template.docx (copy of Variant_A).
 * Writes: same path with:
 *   1. <<№*>>            → №{{dispositionNumber}}
 *   2. <<від ... р.>>     → від {{dispositionDate}} р.
 *   3. <<Дата_виконання>>→ {{executionDate}}
 *   4. {{IF_ROP}}         → {{#hasRop}}    (docxtemplater section-tag for condition)
 *   5. {{/IF_ROP}}        → {{/hasRop}}
 *
 * 23 інших jinja-тегів ({{ROLE_*}}, {{ROP}}, {{бр}}, {{дата_бр}}, {{КСП_РОТИ}},
 * {{населений_пункт}}, {{ROP_FIRST}}, {{ACK_LIST}}) — лишаються як є; саме так
 * disposition-builder.ts їх передаватиме.
 *
 * docxtemplater сам зливає `<w:t>` runs при парсингу тегів — Word'івське
 * розбиття `{{населений_пункт}}` на 3 runs не зашкодить.
 */
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

const docxPath = path.resolve(__dirname, '..', 'resources', 'templates', 'disposition-template.docx')
console.log('[transform] Reading:', docxPath)

const buf = fs.readFileSync(docxPath)
const zip = new PizZip(buf)
let xml = zip.file('word/document.xml').asText()
console.log('[transform] document.xml size:', xml.length)

// 1-3: <<...>> blocks — escaped як &lt;&lt;...&gt;&gt; у XML.
const replacements = [
  // <<№*>> — номер БР роти. Зберігаємо `№` як фіксований символ перед тегом.
  [/&lt;&lt;№\*&gt;&gt;/g, '№{{dispositionNumber}}'],
  // <<від 01.01.2026 р.>> — дата БР роти.
  [/&lt;&lt;від \d{2}\.\d{2}\.\d{4} р\.&gt;&gt;/g, 'від {{dispositionDate}} р.'],
  // <<Дата_виконання>> — дата виконання БР.
  [/&lt;&lt;Дата_виконання&gt;&gt;/g, '{{executionDate}}'],
  // 4-5: jinja conditional → docxtemplater section. Conditional на truthy
  // boolean: `{{#hasRop}}...{{/hasRop}}` рендериться лише коли hasRop=true.
  [/\{\{IF_ROP\}\}/g, '{{#hasRop}}'],
  [/\{\{\/IF_ROP\}\}/g, '{{/hasRop}}']
]

for (const [re, rep] of replacements) {
  const matches = xml.match(re) || []
  if (matches.length === 0) {
    console.warn(`[transform] No matches for: ${re}`)
  } else {
    console.log(`[transform] ${matches.length}× ${re} → ${rep}`)
    xml = xml.replace(re, rep)
  }
}

zip.file('word/document.xml', xml)
const out = zip.generate({ type: 'nodebuffer' })
fs.writeFileSync(docxPath, out)
console.log('[transform] Wrote:', docxPath, '(' + out.length + ' bytes)')
