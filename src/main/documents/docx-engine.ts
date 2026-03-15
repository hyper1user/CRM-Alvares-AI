/**
 * DOCX Engine — generates documents from .docx templates using docxtemplater
 * Supports both {tag} and <<tag>> delimiters (auto-detected)
 */
import { readFileSync } from 'fs'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

interface DelimiterConfig {
  start: string
  end: string
}

const DEFAULT_DELIMITERS: DelimiterConfig = { start: '{', end: '}' }
const ANGLE_DELIMITERS: DelimiterConfig = { start: '<<', end: '>>' }

/**
 * Auto-detect delimiter type by scanning word/document.xml
 * Returns <<>> if found, otherwise default {}
 */
function detectDelimiters(zip: PizZip): DelimiterConfig {
  try {
    const xmlContent = zip.file('word/document.xml')?.asText() ?? ''
    // Check for <<TAG>> pattern (including cyrillic chars)
    if (/&lt;&lt;[\p{L}\w]+&gt;&gt;/u.test(xmlContent) || /<<[\p{L}\w]+>>/u.test(xmlContent)) {
      return ANGLE_DELIMITERS
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_DELIMITERS
}

/**
 * Generate a .docx buffer by rendering template with data
 */
export function generateDocx(templatePath: string, data: Record<string, string>): Buffer {
  const content = readFileSync(templatePath, 'binary')
  const zip = new PizZip(content)
  const delimiters = detectDelimiters(zip)

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters
  })
  doc.render(data)
  return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer
}

/**
 * Extract template tags (placeholders) from a .docx template
 * Supports both {tag} and <<tag>> delimiters, including cyrillic tag names
 */
export function getTemplateTags(templatePath: string): string[] {
  const content = readFileSync(templatePath, 'binary')
  const zip = new PizZip(content)

  const tags = new Set<string>()

  const xmlFiles = ['word/document.xml', 'word/header1.xml', 'word/footer1.xml']
  for (const xmlFile of xmlFiles) {
    try {
      const xmlContent = zip.file(xmlFile)?.asText() ?? ''

      // Match {tagName} — latin + digits + underscore
      const braceRegex = /\{([a-zA-Z_]\w*)\}/g
      let match: RegExpExecArray | null
      while ((match = braceRegex.exec(xmlContent)) !== null) {
        tags.add(match[1])
      }

      // Match <<TAG>> — supports cyrillic, latin, digits, underscore, spaces
      // In XML, < and > may be escaped as &lt; &gt;
      const angleEscRegex = /&lt;&lt;([\p{L}\w\s]+?)&gt;&gt;/gu
      while ((match = angleEscRegex.exec(xmlContent)) !== null) {
        tags.add(match[1].trim())
      }

      // Also match raw <<TAG>> (sometimes present in runs)
      const angleRawRegex = /<<([\p{L}\w\s]+?)>>/gu
      while ((match = angleRawRegex.exec(xmlContent)) !== null) {
        tags.add(match[1].trim())
      }
    } catch {
      // skip if file not found
    }
  }

  return Array.from(tags)
}

/**
 * Create a minimal .docx file with given text content (for template generation)
 */
export function createMinimalDocx(textLines: string[]): Buffer {
  const paragraphs = textLines
    .map(
      (line) =>
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
    )
    .join('')

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  mc:Ignorable="w14 wp14">
  <w:body>${paragraphs}</w:body>
</w:document>`

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`

  const zip = new PizZip()
  zip.file('[Content_Types].xml', contentTypesXml)
  zip.file('_rels/.rels', relsXml)
  zip.file('word/_rels/document.xml.rels', docRelsXml)
  zip.file('word/document.xml', documentXml)

  return zip.generate({ type: 'nodebuffer' }) as Buffer
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
