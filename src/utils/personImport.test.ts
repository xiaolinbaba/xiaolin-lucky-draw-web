// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { checkWorkbookArchive, importLimits, parsePersonWorkbook } from './personImport'

function workbook(rows: Record<string, unknown>[]) {
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), 'People')
  return XLSX.write(book, { type: 'array', bookType: 'xlsx', compression: false }) as ArrayBuffer
}
describe('bounded participant import', () => {
  it('maps headers without rewriting content or inherited field names', async () => {
    const data = workbook([{ 编号: '001', 姓名: 'name uid', constructor: 'reserved value', custom_name: 'custom value', 部门: 'department' }])
    await checkWorkbookArchive(data)
    expect(parsePersonWorkbook(data)[0]).toMatchObject({ uid: '001', name: 'name uid', custom_name: 'custom value', department: 'department' })
  })
  it('rejects duplicates and missing required values without producing a partial list', () => {
    expect(() => parsePersonWorkbook(workbook([{ Number: '1', Name: 'A' }, { Number: '1', Name: 'B' }]))).toThrow('importInvalid')
    expect(() => parsePersonWorkbook(workbook([{ Number: '1', Name: '' }]))).toThrow('importInvalid')
  })
  it('rejects too many rows and columns', () => {
    const rows = Array.from({ length: importLimits.rows + 1 }, (_, index) => ({ Number: String(index), Name: 'A' }))
    expect(() => parsePersonWorkbook(workbook(rows))).toThrow('importLimit')
    expect(() => parsePersonWorkbook(workbook([Object.fromEntries(Array.from({ length: 51 }, (_, index) => [`Col${index}`, 'X']))]))).toThrow('importLimit')
  })
  it('rejects false expanded sizes in archive metadata', async () => {
    const data = workbook([{ 编号: '1', 姓名: 'A' }])
    const bytes = new DataView(data)
    for (let offset = 0; offset < data.byteLength - 46; offset++) {
      if (bytes.getUint32(offset, true) === 0x02014B50) {
        bytes.setUint32(offset + 24, importLimits.expandedBytes + 1, true)
        break
      }
    }
    await expect(checkWorkbookArchive(data)).rejects.toThrow('importLimit')
  })
})
