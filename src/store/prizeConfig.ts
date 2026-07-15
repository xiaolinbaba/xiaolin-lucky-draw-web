import type { IPrizeConfig } from '@/types/storeType'
import { defineStore } from 'pinia'
import { defaultCurrentPrize, defaultPrizeList, defaultTemporaryPrize } from './data'

function clone<T>(val: T): T {
  return structuredClone(val)
}

function createDefaultPrizeConfig() {
  return {
    prizeList: clone(defaultPrizeList),
    currentPrize: clone(defaultCurrentPrize),
    temporaryPrize: clone(defaultTemporaryPrize),
  }
}

export const usePrizeConfig = defineStore('prize', {
  state() {
    return {
      prizeConfig: {
        ...createDefaultPrizeConfig(),
      },
    }
  },
  getters: {
    // 获取全部配置
    getPrizeConfigAll(state) {
      return state.prizeConfig
    },
    // 获取奖品列表
    getPrizeConfig(state) {
      return state.prizeConfig.prizeList
    },
    // 根据id获取配置
    getPrizeConfigById(state) {
      return (id: number | string) => {
        return state.prizeConfig.prizeList.find(item => String(item.id) === String(id))
      }
    },
    // 获取当前奖项
    getCurrentPrize(state) {
      return state.prizeConfig.currentPrize
    },
    // 获取临时的奖项
    getTemporaryPrize(state) {
      return state.prizeConfig.temporaryPrize
    },

  },
  actions: {
    // 设置奖项
    setPrizeConfig(prizeList: IPrizeConfig[]) {
      this.prizeConfig.prizeList = prizeList
    },
    // 添加奖项
    addPrizeConfig(prizeConfigItem: IPrizeConfig) {
      this.prizeConfig.prizeList.push(prizeConfigItem)
    },
    // 删除奖项
    deletePrizeConfig(prizeConfigItemId: number | string) {
      this.prizeConfig.prizeList = this.prizeConfig.prizeList.filter(item => String(item.id) !== String(prizeConfigItemId))
      if (String(this.prizeConfig.currentPrize.id) === String(prizeConfigItemId)) {
        this.selectNextAvailablePrize()
      }
    },
    // 更新奖项数据
    updatePrizeConfig(prizeConfigItem: IPrizeConfig) {
      if (!prizeConfigItem.isUsed) {
        return
      }
      this.selectNextAvailablePrize()
      this.resetTemporaryPrize()
    },
    // 删除全部奖项
    deleteAllPrizeConfig() {
      this.prizeConfig.prizeList = [] as IPrizeConfig[]
      this.setNoCurrentPrize()
      this.resetTemporaryPrize()
    },
    // 设置当前奖项
    setCurrentPrize(prizeConfigItem: IPrizeConfig) {
      this.prizeConfig.currentPrize = prizeConfigItem
    },
    setNoCurrentPrize() {
      this.prizeConfig.currentPrize = clone(defaultTemporaryPrize)
    },
    selectNextAvailablePrize() {
      const nextPrize = this.prizeConfig.prizeList.find(prize => prize.isShow && !prize.isUsed)
      if (nextPrize) {
        this.setCurrentPrize(nextPrize)
      }
      else {
        this.setNoCurrentPrize()
      }
    },
    rollbackPrizeWins(prizeIds: Array<number | string>) {
      let reopenedPrize: IPrizeConfig | undefined
      const uniquePrizeIds = new Set(prizeIds.map(String))

      for (const prizeId of uniquePrizeIds) {
        const prize = this.prizeConfig.prizeList.find(item => String(item.id) === prizeId)
        if (!prize || prize.isUsedCount <= 0) {
          continue
        }

        prize.isUsedCount--
        prize.isUsed = false

        for (let index = prize.separateCount.countList.length - 1; index >= 0; index--) {
          const countItem = prize.separateCount.countList[index]
          if (countItem.isUsedCount > 0) {
            countItem.isUsedCount--
            break
          }
        }

        reopenedPrize ??= prize
      }

      if (reopenedPrize) {
        this.setCurrentPrize(reopenedPrize)
      }
    },
    // 设置临时奖项
    setTemporaryPrize(prizeItem: IPrizeConfig) {
      if (prizeItem.isShow === false) {
        this.selectNextAvailablePrize()
        this.resetTemporaryPrize()

        return
      }

      this.prizeConfig.temporaryPrize = prizeItem
    },
    // 重置临时奖项
    resetTemporaryPrize() {
      this.prizeConfig.temporaryPrize = clone(defaultTemporaryPrize) as IPrizeConfig
    },
    // 重置所有配置
    resetDefault() {
      // 重要：必须深拷贝默认值，避免默认对象在抽奖过程中被污染导致“重置无效”
      this.prizeConfig = createDefaultPrizeConfig()
    },

    // 仅重置“抽取进度”，不改动奖项的名称/人数/图片等配置
    // 用于：清空人员中奖信息后，首页奖项进度也要同步清零
    resetDrawProgress() {
      const list = this.prizeConfig.prizeList
      if (!list?.length) {
        this.setNoCurrentPrize()
        this.resetTemporaryPrize()
        return
      }

      for (const prize of list) {
        prize.isUsed = false
        prize.isUsedCount = 0
        if (prize.separateCount?.countList?.length) {
          for (const countItem of prize.separateCount.countList) {
            countItem.isUsedCount = 0
          }
        }
      }

      // 当前奖项切回第一个可见奖项（此处全部已重置为未使用）
      this.selectNextAvailablePrize()
      this.resetTemporaryPrize()
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        // 如果要存储在localStorage中
        storage: localStorage,
        key: 'prizeConfig',
      },
    ],
  },
})
