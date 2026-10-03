import * as XLSX from 'xlsx'

export const importLimits = { bytes: 10 * 1024 * 1024, expandedBytes: 50 * 1024 * 1024, rows: 20000, columns: 50 }

export function parsePersonWorkbook(buffer: ArrayBuffer) {
  if (buffer.byteLength > importLimits.bytes)
    throw new Error('importLimit')
  const book = XLSX.read(buffer, { type: 'array', cellDates: true, cellFormula: false, sheetRows: importLimits.rows + 2 })
  const sheet = book.Sheets[book.SheetNames[0]]
  if (!sheet?.['!ref'])
    throw new Error('importInvalid')
  const range = XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref'])
  if (range.e.r - range.s.r > importLimits.rows || range.e.c >= importLimits.columns)
    throw new Error('importLimit')
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const mapping: Record<string, string> = {
    编号: 'uid',
    姓名: 'name',
    部门: 'department',
    职位: 'identity',
    Number: 'uid',
    Name: 'name',
    Department: 'department',
    Position: 'identity',
  }
  const people = rows.map((row) => {
    const person: Record<string, unknown> = Object.create(null)
    for (const [key, value] of Object.entries(row)) {
      if (key === '__proto__' || key === 'prototype')
        continue
      person[Object.hasOwn(mapping, key) ? mapping[key] : key] = value
    }
    return { ...person, uid: String(person.uid ?? '').trim(), name: String(person.name ?? '').trim(), department: String(person.department ?? '').trim(), identity: String(person.identity ?? '').trim(), avatar: '' }
  })
  if (!people.length || people.some(p => !p.uid || !p.name) || new Set(people.map(p => p.uid)).size !== people.length)
    throw new Error('importInvalid')
  return people
}

// Check actual expanded ZIP bytes before SheetJS allocates workbook structures.
export async function checkWorkbookArchive(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint32(0, true) !== 0x04034B50)
    return // Legacy XLS is not ZIP.
  let end = view.byteLength - 22
  const lower = Math.max(0, end - 65535)
  while (end >= lower && view.getUint32(end, true) !== 0x06054B50) end--
  if (end < lower)
    throw new Error('importInvalid')
  const count = view.getUint16(end + 10, true)
  let offset = view.getUint32(end + 16, true)
  let expanded = 0
  for (let entry = 0; entry < count; entry++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014B50)
      throw new Error('importInvalid')
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const size = view.getUint32(offset + 24, true)
    const local = view.getUint32(offset + 42, true)
    if (size === 0xFFFFFFFF || compressedSize === 0xFFFFFFFF || size + expanded > importLimits.expandedBytes)
      throw new Error('importLimit')
    if (local + 30 > offset || view.getUint32(local, true) !== 0x04034B50)
      throw new Error('importInvalid')
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
    if (start + compressedSize > offset)
      throw new Error('importInvalid')
    const bytes = new Blob([buffer.slice(start, start + compressedSize)]).stream()
    const reader = (method === 0 ? bytes : method === 8 ? bytes.pipeThrough(new DecompressionStream('deflate-raw')) : null)?.getReader()
    if (!reader)
      throw new Error('importInvalid')
    let actual = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done)
          break
        actual += value.byteLength
        if (actual > size || expanded + actual > importLimits.expandedBytes)
          throw new Error('importLimit')
      }
    }
    finally { await reader.cancel() }
    if (actual !== size)
      throw new Error('importInvalid')
    expanded += actual
    offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true)
  }
}
