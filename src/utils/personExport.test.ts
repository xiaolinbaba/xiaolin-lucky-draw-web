import type { IPersonConfig } from '@/types/storeType'
import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { buildPersonExportRows } from './personExport'

describe('participant workbook export', () => {
  it('translates headers without altering keywords, quotes, custom columns, or award contents', () => {
    const person: IPersonConfig & { custom_name: string } = {
      id: 1,
      uid: 'uid-001',
      name: 'name "uid" department identity prizeName prizeTime isWin',
      department: 'department-name',
      identity: 'identity',
      avatar: '',
      isWin: true,
      x: 1,
      y: 1,
      createTime: '',
      updateTime: '',
      prizeName: ['prizeName "name"', 'uid prizeTime'],
      prizeId: ['001', '002'],
      prizeTime: ['2026-10-03 10:00:00', '2026-10-03 10:01:00'],
      custom_name: 'name uid',
    }
    const before = JSON.stringify(person)
    const labels: Record<string, string> = {
      'data.number': '编号',
      'data.name': '姓名',
      'data.department': '部门',
      'data.identity': '职位',
      'data.isWin': '是否中奖',
      'data.prizeName': '奖项名称',
      'data.prizeTime': '中奖时间',
      'data.yes': '是',
      'data.no': '否',
    }
    const rows = buildPersonExportRows([person], key => labels[key])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Sheet1')
    const result = XLSX.read(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }), { type: 'array' })
    const exported = XLSX.utils.sheet_to_json(result.Sheets.Sheet1)[0]

    expect(exported).toEqual({
      编号: person.uid,
      姓名: person.name,
      部门: person.department,
      职位: person.identity,
      是否中奖: '是',
      奖项名称: person.prizeName.join(','),
      中奖时间: person.prizeTime.join(','),
      custom_name: person.custom_name,
    })
    expect(JSON.stringify(person)).toBe(before)
  })
})
