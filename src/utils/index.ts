import dayjs from 'dayjs'
import { selectAvailableIndex } from './random'
// 筛选人员数据
export function filterData(tableData: any[], localRowCount: number) {
  const dataLength = tableData.length
  let j = 0
  for (let i = 0; i < dataLength; i++) {
    if (i % localRowCount === 0) {
      j++
    }
    tableData[i].x = i % localRowCount + 1
    tableData[i].y = j
    tableData[i].id = i
    // 是否中奖
  }

  return tableData
}

export function addOtherInfo(personList: any[]) {
  const len = personList.length
  for (let i = 0; i < len; i++) {
    personList[i].id = i
    personList[i].createTime = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')
    personList[i].updateTime = dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss')
    personList[i].prizeName = [] as string[]
    personList[i].prizeTime = [] as string[]
    personList[i].prizeId = []
    personList[i].isWin = false
  }

  return personList
}

export function selectCard(cardIndexArr: number[], tableLength: number, _personId: number): number | null {
  // _personId 目前未参与计算，保留参数以兼容调用方
  return selectAvailableIndex(cardIndexArr, tableLength)
}

export function themeChange(theme: string) {
  // 获取根html
  const html = document.querySelectorAll('html')
  if (html) {
    html[0].setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }
}
