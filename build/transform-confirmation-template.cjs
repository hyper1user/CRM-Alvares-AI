/**
 * One-shot script: transform a real confirmation .docx (with data) into a
 * docxtemplater template (with {tag} placeholders + {#section1}/{#section2}
 * loops).
 *
 * Reads:  resources/templates/confirmation-template.docx (assumed to be a
 *         copy of the April-2026 reference report; will be OVERWRITTEN).
 * Writes: same path with two transformations:
 *   1. Each <w:tbl> reduced to: header row + ONE template row.
 *   2. Row 1 cells (commander Krasnyy) → {rank} {fullName} {position}
 *      {grounds} {datesRange} {totalDays}, wrapped in {#section1}/{/section1}
 *      (or section2 for the second table).
 *   3. Tail signature: «капітан» → {commanderRank}, «Євген КРАСНИЙ» →
 *      {commanderName}, «30.04.2026» → {reportDate}.
 *
 * Idempotent: running twice on the produced template would do nothing
 * useful but would not corrupt the file.
 */
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')

const docxPath = path.resolve(__dirname, '..', 'resources', 'templates', 'confirmation-template.docx')

console.log('[transform] Reading:', docxPath)
const buf = fs.readFileSync(docxPath)
const zip = new PizZip(buf)
let xml = zip.file('word/document.xml').asText()
console.log('[transform] document.xml size:', xml.length)

function findRows(tableBlock) {
  const rows = []
  let p = 0
  while (true) {
    const s = tableBlock.indexOf('<w:tr', p)
    if (s < 0) break
    // Distinguish <w:tr> / <w:tr ...> from <w:trPr>
    const next = tableBlock[s + 5]
    if (next === ' ' || next === '>') {
      const e = tableBlock.indexOf('</w:tr>', s) + '</w:tr>'.length
      rows.push({ s, e, block: tableBlock.substring(s, e) })
      p = e
    } else {
      p = s + 1
    }
  }
  return rows
}

function processTable(xmlIn, fromOffset, sectionTag) {
  const tStart = xmlIn.indexOf('<w:tbl>', fromOffset)
  if (tStart < 0) throw new Error('Table not found at offset ' + fromOffset)
  const tEnd = xmlIn.indexOf('</w:tbl>', tStart) + '</w:tbl>'.length
  const tableBlock = xmlIn.substring(tStart, tEnd)
  const rows = findRows(tableBlock)
  console.log(`[transform] Table at ${tStart}: ${rows.length} rows`)
  if (rows.length < 2) throw new Error('Table needs at least 2 <w:tr>')

  // Take Row 1 (commander Krasnyy) as the template — its cells contain
  // single non-split <w:t> runs, which makes regex replacement reliable.
  let templateRow = rows[1].block

  const replacements = [
    [/(<w:t[^>]*>)капітан(<\/w:t>)/, `$1{#${sectionTag}}{rank}$2`],
    [/(<w:t[^>]*>)Красний Євген Геннадійович(<\/w:t>)/, '$1{fullName}$2'],
    [/(<w:t[^>]*>)Командир 12 штурмової роти 4 штурмового батальйону(<\/w:t>)/, '$1{position}$2'],
    [/(<w:t[^>]*>)БР командира 4 ШБ[^<]*(<\/w:t>)/, '$1{grounds}$2'],
    [/(<w:t[^>]*>)з \d{2}\.\d{2}\.\d{4} по \d{2}\.\d{2}\.\d{4}(<\/w:t>)/, '$1{datesRange}$2'],
    // Total-days cell has only digits; in Row 1 only one such <w:t>
    // remains after the previous replacements (the others were full-text).
    [/(<w:t[^>]*>)\d+(<\/w:t>)/, `$1{totalDays}{/${sectionTag}}$2`]
  ]

  for (const [re, rep] of replacements) {
    if (!re.test(templateRow)) {
      throw new Error(`Replacement failed for table ${sectionTag}: ${re}`)
    }
    templateRow = templateRow.replace(re, rep)
  }

  const header = rows[0].block
  const beforeFirstRow = tableBlock.substring(0, rows[0].s)
  const afterLastRow = tableBlock.substring(rows[rows.length - 1].e)
  const newTable = beforeFirstRow + header + templateRow + afterLastRow

  return {
    newXml: xmlIn.substring(0, tStart) + newTable + xmlIn.substring(tEnd),
    nextOffset: tStart + newTable.length
  }
}

const r1 = processTable(xml, 0, 'section1')
const r2 = processTable(r1.newXml, r1.nextOffset, 'section2')
xml = r2.newXml

// Tail signature: capтан is now unique (the Row-1 instances were already
// rewritten to {rank}). Євген КРАСНИЙ is the all-caps signature form
// (different from Row-1 «Красний Євген Геннадійович», so no collision).
const tailReplacements = [
  [/(<w:t[^>]*>)капітан(<\/w:t>)/g, '$1{commanderRank}$2'],
  [/(<w:t[^>]*>)Євген КРАСНИЙ(<\/w:t>)/g, '$1{commanderName}$2'],
  [/(<w:t[^>]*>)30\.04\.2026(<\/w:t>)/g, '$1{reportDate}$2']
]
for (const [re, rep] of tailReplacements) {
  if (!re.test(xml)) {
    console.warn(`[transform] Tail replacement skipped (not found): ${re}`)
  }
  xml = xml.replace(re, rep)
}

zip.file('word/document.xml', xml)
const out = zip.generate({ type: 'nodebuffer' })
fs.writeFileSync(docxPath, out)
console.log('[transform] Wrote template:', docxPath, '(' + out.length + ' bytes)')
