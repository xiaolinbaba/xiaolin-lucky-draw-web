import type { IPersonConfig, IPrizeConfig } from '@/types/storeType'

import { bundledMusicList } from '@/utils/music'
// 获取 Vite base 路径，用于正确访问 public 目录下的资源
// 确保 baseUrl 以 / 结尾，如果没有则添加
const baseUrl = import.meta.env.BASE_URL || '/'
const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

// 生成随机六位数字
function generateRandomSixDigits(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 生成随机编号：hx + 六位随机数字
function generateUid(): string {
  return `hx${generateRandomSixDigits()}`
}

type AvatarGender = 'men' | 'women'

function randomPick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function randomIntInclusive(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 常见姓氏（足够多以减少重复概率）
const surnameList = [
  '赵',
  '钱',
  '孙',
  '李',
  '周',
  '吴',
  '郑',
  '王',
  '冯',
  '陈',
  '褚',
  '卫',
  '蒋',
  '沈',
  '韩',
  '杨',
  '朱',
  '秦',
  '尤',
  '许',
  '何',
  '吕',
  '施',
  '张',
  '孔',
  '曹',
  '严',
  '华',
  '金',
  '魏',
  '陶',
  '姜',
  '戚',
  '谢',
  '邹',
  '喻',
  '柏',
  '水',
  '窦',
  '章',
  '云',
  '苏',
  '潘',
  '葛',
  '奚',
  '范',
  '彭',
  '郎',
  '鲁',
  '韦',
  '昌',
  '马',
  '苗',
  '凤',
  '花',
  '方',
  '俞',
  '任',
  '袁',
  '柳',
  '鲍',
  '史',
  '唐',
  '费',
  '廉',
  '岑',
  '薛',
  '雷',
  '贺',
  '倪',
  '汤',
  '滕',
  '殷',
  '罗',
  '毕',
  '郝',
  '邬',
  '安',
  '常',
  '乐',
  '于',
  '时',
  '傅',
  '皮',
  '卞',
  '齐',
  '康',
  '伍',
  '余',
  '元',
  '卜',
  '顾',
  '孟',
  '平',
  '黄',
  '和',
  '穆',
  '萧',
  '尹',
]

// 男/女用字（尽量“听起来舒服”）
const maleGivenNameFirst = ['宇', '泽', '浩', '俊', '子', '嘉', '博', '承', '睿', '昊', '铭', '梓', '亦', '景', '彦', '天']
const maleGivenNameSecond = ['轩', '航', '辰', '然', '铭', '杰', '霖', '阳', '成', '安', '凡', '昕', '泽', '瑞', '宁', '奕']
const femaleGivenNameFirst = ['诗', '雨', '若', '婉', '思', '依', '欣', '语', '安', '梦', '芷', '清', '念', '沐', '星', '心']
const femaleGivenNameSecond = ['涵', '琪', '妍', '怡', '琳', '悦', '彤', '宁', '瑶', '然', '汐', '萱', '晴', '璇', '雅', '珂']

function generateName(gender: AvatarGender): string {
  const surname = randomPick(surnameList)
  const givenLen = Math.random() < 0.85 ? 2 : 1 // 大多数是 2 字名

  if (gender === 'men') {
    const first = randomPick(maleGivenNameFirst)
    const second = givenLen === 2 ? randomPick(maleGivenNameSecond) : ''
    return `${surname}${first}${second}`
  }

  const first = randomPick(femaleGivenNameFirst)
  const second = givenLen === 2 ? randomPick(femaleGivenNameSecond) : ''
  return `${surname}${first}${second}`
}

// 部门列表
const departmentList = [
  '工程部',
  '行政部',
  '人事部',
  '市场部',
  '营运部',
  '研发部',
  '信息部',
  '采购部',
  '审计部',
]

// 职位列表
const identityList = [
  '总经理',
  '总监',
  '经理',
  '主管',
  '专员',
]

// 生成随机默认人员列表
function generateDefaultPersonList(count: number = 50): IPersonConfig[] {
  const personList: IPersonConfig[] = []
  const currentTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  const usedNames = new Set<string>()
  const usedUids = new Set<string>()

  for (let i = 0; i < count; i++) {
    const randomDepartment = randomPick(departmentList)
    const randomIdentity = randomPick(identityList)

    // 姓名 + 头像性别绑定，并确保姓名不重复
    const avatarGender: AvatarGender = Math.random() > 0.5 ? 'men' : 'women'
    let name = ''
    for (let tryCount = 0; tryCount < 2000; tryCount++) {
      name = generateName(avatarGender)
      if (!usedNames.has(name)) {
        usedNames.add(name)
        break
      }
    }
    if (!name) {
      // 极端情况下兜底（理论上不会发生）
      name = `${generateName(avatarGender)}${i}`
      usedNames.add(name)
    }

    // uid 也做去重，避免随机碰撞导致重复
    let uid = ''
    for (let tryCount = 0; tryCount < 2000; tryCount++) {
      uid = generateUid()
      if (!usedUids.has(uid)) {
        usedUids.add(uid)
        break
      }
    }
    if (!uid) {
      uid = `hx${(100000 + i).toString().padStart(6, '0')}`
      usedUids.add(uid)
    }

    const randomAvatarIndex = randomIntInclusive(1, 99)

    // 计算 x, y 坐标（基于17列布局，每行17个）
    const x = (i % 17) + 1
    const y = Math.floor(i / 17) + 1

    personList.push({
      uid,
      name,
      department: randomDepartment,
      identity: randomIdentity,
      avatar: `https://randomuser.me/api/portraits/${avatarGender}/${randomAvatarIndex}.jpg`,
      x,
      y,
      id: i,
      isWin: false,
      createTime: currentTime,
      updateTime: currentTime,
      prizeName: [],
      prizeTime: [],
      prizeId: [],
    })
  }

  return personList
}

// 导出生成函数，而不是直接导出数据，这样每次调用时都会生成新的随机数据
export function getDefaultPersonList(count: number = 50): IPersonConfig[] {
  return generateDefaultPersonList(count)
}

export const defaultMusicList = bundledMusicList

export const defaultPrizeList = <IPrizeConfig[]>[
  {
    id: '001',
    name: '三等奖',
    sort: 1,
    isAll: false,
    count: 3,
    isUsedCount: 0,
    picture: {
      id: '2',
      name: '三等奖',
      url: `${normalizedBaseUrl}images/image3.png`,
    },
    separateCount: {
      enable: true,
      countList: [],
    },
    desc: '三等奖',
    isShow: true,
    isUsed: false,
    frequency: 1,
  },
  {
    id: '002',
    name: '二等奖',
    sort: 2,
    isAll: false,
    count: 2,
    isUsedCount: 0,
    picture: {
      id: '1',
      name: '二等奖',
      url: `${normalizedBaseUrl}images/image2.png`,
    },
    separateCount: {
      enable: false,
      countList: [],
    },
    desc: '二等奖',
    isShow: true,
    isUsed: false,
    frequency: 1,
  },
  {
    id: '003',
    name: '一等奖',
    sort: 3,
    isAll: false,
    count: 1,
    isUsedCount: 0,
    picture: {
      id: '0',
      name: '一等奖',
      url: `${normalizedBaseUrl}images/image1.png`,
    },
    separateCount: {
      enable: false,
      countList: [],
    },
    desc: '一等奖',
    isShow: true,
    isUsed: false,
    frequency: 1,
  },
  {
    id: '004',
    name: '超级大奖',
    sort: 4,
    isAll: false,
    count: 1,
    isUsedCount: 0,
    picture: {
      id: '3',
      name: '超级奖',
      url: `${normalizedBaseUrl}images/image4.png`,
    },
    separateCount: {
      enable: false,
      countList: [],
    },
    desc: '超级大奖',
    isShow: true,
    isUsed: false,
    frequency: 1,
  },
  {
    id: '005',
    name: '特别奖',
    sort: 5,
    isAll: false,
    count: 1,
    isUsedCount: 0,
    picture: {
      id: '4',
      name: '特别奖',
      url: `${normalizedBaseUrl}images/image5.png`,
    },
    separateCount: {
      enable: false,
      countList: [],
    },
    desc: '特别奖',
    isShow: true,
    isUsed: false,
    frequency: 1,
  },
]
export const defaultCurrentPrize = <IPrizeConfig>{
  id: '001',
  name: '三等奖',
  sort: 1,
  isAll: false,
  count: 12,
  isUsedCount: 0,
  picture: {
    id: '2',
    name: '三等奖',
    url: '/images/image3.png',
  },
  separateCount: {
    enable: true,
    countList: [],
  },
  desc: '三等奖',
  isShow: true,
  isUsed: false,
  frequency: 1,
}
export const defaultTemporaryPrize = <IPrizeConfig>{
  id: '',
  name: '',
  sort: 0,
  isAll: false,
  count: 1,
  isUsedCount: 0,
  picture: {
    id: '-1',
    name: '',
    url: '',
  },
  separateCount: {
    enable: true,
    countList: [],
  },
  desc: '',
  isShow: false,
  isUsed: false,
  frequency: 1,
}

export const defaultImageList = [
  {
    id: '0',
    name: '一等奖',
    url: '/images/image1.png',
  },
  {
    id: '1',
    name: '二等奖',
    url: '/images/image2.png',
  },
  {
    id: '2',
    name: '三等奖',
    url: '/images/image3.png',
  },
  {
    id: '3',
    name: '超级奖',
    url: '/images/image4.png',
  },
  {
    id: '4',
    name: '特别奖',
    url: '/images/image5.png',
  },
]
export const defaultPatternList = [21, 38, 55, 54, 53, 70, 87, 88, 89, 23, 40, 57, 74, 91, 92, 93, 76, 59, 42, 25, 24, 27, 28, 29, 46, 63, 62, 61, 78, 95, 96, 97, 20, 19, 31, 48, 65, 66, 67, 84, 101, 100, 99, 32, 33]
