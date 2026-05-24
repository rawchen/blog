// 全局播放器管理器 - 确保同一时间只有一个播放器在播放/展开

class PlayerManager {
  constructor() {
    this.players = new Set()
    this.currentPlayingId = null
    this.currentExpandedLyricId = null
    this.currentExpandedListId = null
  }

  // 注册播放器
  register(player) {
    this.players.add(player)
    return () => {
      this.players.delete(player)
    }
  }

  // 通知开始播放，暂停其他播放器
  notifyPlay(id, pauseCallback) {
    if (this.currentPlayingId && this.currentPlayingId !== id) {
      // 通知之前播放的播放器暂停
      this.players.forEach(player => {
        if (player.id === this.currentPlayingId && player.pause) {
          player.pause()
        }
      })
    }
    this.currentPlayingId = id
  }

  // 停止播放
  notifyStop(id) {
    if (this.currentPlayingId === id) {
      this.currentPlayingId = null
    }
  }

  // 展开歌词，收起其他的
  expandLyric(id, collapseCallback) {
    // 收起所有播放列表
    this.players.forEach(player => {
      if (player.id !== id && player.collapseList) {
        player.collapseList()
      }
    })
    this.currentExpandedListId = null

    // 收起其他播放器的歌词
    if (this.currentExpandedLyricId && this.currentExpandedLyricId !== id) {
      this.players.forEach(player => {
        if (player.id === this.currentExpandedLyricId && player.collapseLyric) {
          player.collapseLyric()
        }
      })
    }
    this.currentExpandedLyricId = id
  }

  // 收起歌词
  collapseLyric(id) {
    if (this.currentExpandedLyricId === id) {
      this.currentExpandedLyricId = null
    }
  }

  // 展开播放列表，收起其他的
  expandList(id) {
    // 收起所有歌词
    this.players.forEach(player => {
      if (player.id !== id && player.collapseLyric) {
        player.collapseLyric()
      }
    })
    this.currentExpandedLyricId = null

    // 收起其他播放器的列表
    if (this.currentExpandedListId && this.currentExpandedListId !== id) {
      this.players.forEach(player => {
        if (player.id === this.currentExpandedListId && player.collapseList) {
          player.collapseList()
        }
      })
    }
    this.currentExpandedListId = id
  }

  // 收起播放列表
  collapseList(id) {
    if (this.currentExpandedListId === id) {
      this.currentExpandedListId = null
    }
  }
}

// 单例
const playerManager = new PlayerManager()

// 生成唯一ID
let idCounter = 0
export const generatePlayerId = () => {
  idCounter++
  return `player-${Date.now()}-${idCounter}`
}

export default playerManager