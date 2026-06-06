import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import './index.css'
import playerManager, { generatePlayerId } from './playerManager'

// 播放/暂停图标
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
)

// 音量图标
const VolumeIcon = ({ muted }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    {muted ? (
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.61-7.92-6.32-9.48v2.16C17.44 6.08 19 8.85 19 12zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    ) : (
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    )}
  </svg>
)

// 列表图标
const ListIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
  </svg>
)

// 歌词图标
const LyricIcon = () => (
  <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
    <path d="M793.941 160H230.06C191.36 160 160 191.616 160 230.059v563.84C160 832.64 191.616 864 230.059 864h563.84c38.698 0 70.058-31.616 70.058-70.059V230.06C864 191.36 832.384 160 793.941 160z m5.718 640c0-0.299-575.659-0.341-575.659-0.341 0.299 0 0.341-575.659 0.341-575.659 0 0.299 575.659 0.341 575.659 0.341-0.299 0-0.341 575.659-0.341 575.659z m-96-118.528l0.341 0.17V349.654c-1.152-18.602-13.952-28.501-38.357-29.653H459.776c-12.8 1.152-19.755 9.301-20.95 24.405 1.153 15.104 8.15 23.254 20.95 24.406h190.123c3.498 0 5.248 1.749 5.248 5.248V656.64l0.469 0.256h-65.792c-6.699 0-17.579 8.704-18.432 22.656 0.853 15.104 10.112 23.253 18.432 24.405h98.944c8.79-1.066 13.739-8.576 14.89-22.485zM477.227 438.613c-11.648-1.152-18.006-9.301-19.2-24.405 1.152-13.952 7.552-21.504 19.2-22.656h143.018c13.952 1.152 21.504 8.704 22.656 22.656-1.152 15.104-8.149 23.253-20.949 24.405H477.227zM334.72 367.104c-6.827-1.152-22.016-9.301-22.699-24.448 0.683-13.952 13.398-21.504 20.267-22.656h56.235c8.234 1.152 20.01 8.704 20.693 22.656-0.64 15.147-13.141 23.296-20.693 24.448H334.72z m67.499 288.512v-204.8c1.152-25.6-8.704-37.803-29.654-36.65H330.71c-12.8 1.194-19.754 9.343-20.949 24.447 1.152 16.299 8.15 25.003 20.95 26.155h17.45c3.499 0 5.248 1.75 5.248 5.248v206.677a9.985 9.985 0 0 0-0.128 1.622c0.128 3.029 0.853 5.76 1.963 8.234 2.901 9.515 7.893 14.464 19.114 17.238 1.878 0.298 3.712-0.086 5.547-1.067h49.152c7.253-1.152 20.779-9.301 21.461-24.405-0.64-13.952-13.525-21.504-21.461-22.656h-26.837z m97.706-21.632c-24.405 0-36.65-11.648-36.65-34.901V497.92c0-23.253 10.453-34.901 31.402-34.901H597.59c24.406 0 36.054 9.898 34.902 29.653v106.41c0 23.254-10.454 34.902-31.403 34.902H499.925z m12.203-50.603c1.152 2.347 2.901 4.054 5.248 5.248h61.056c3.499 0 5.248-1.749 5.248-5.248v-68.01c0-3.499-1.75-5.248-5.248-5.248h-61.099c-3.498 0-5.248 1.749-5.248 5.248v68.01z"/>
  </svg>
)

const PlayerComponent = React.memo(function PlayerComponent({ id, type, autoplay }) {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [songs, setSongs] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [showLyric, setShowLyric] = useState(false)
  const [showList, setShowList] = useState(true)
  const [lyricsCache, setLyricsCache] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  const audioRef = useRef(null)
  const lyricBodyRef = useRef(null)

  // 生成唯一播放器ID
  const playerId = useMemo(() => generatePlayerId(), [])

  // 注册到全局管理器
  useEffect(() => {
    const playerInstance = {
      id: playerId,
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      },
      collapseLyric: () => setShowLyric(false),
      collapseList: () => setShowList(false)
    }
    return playerManager.register(playerInstance)
  }, [playerId])

  // 加载音乐数据
  useEffect(() => {
    if (!id) return

    const loadPlayer = async () => {
      try {
        setLoading(true)
        setError(null)

        const apiUrl = type === 'collect'
          ? `/api/music/meting?type=playlist&id=${id}`
          : `/api/music/meting?type=song&id=${id}`

        const response = await fetch(apiUrl)
        const data = await response.json()

        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error('未找到音乐')
        }

        const songList = Array.isArray(data) ? data : [data]
        setSongs(songList)
        setLoading(false)
      } catch (err) {
        console.error('加载音乐失败:', err)
        setError(err.message || '加载失败')
        setLoading(false)
      }
    }

    loadPlayer()
  }, [id, type])

  // 创建音频元素
  useEffect(() => {
    if (songs.length === 0) return

    const audio = new Audio()
    audioRef.current = audio

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      playerManager.notifyStop(playerId)
      if (currentIndex < songs.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setCurrentIndex(0)
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      playerManager.notifyStop(playerId)
    }
  }, [songs, currentIndex, playerId])

  // 切换歌曲时更新音频源
  useEffect(() => {
    if (!audioRef.current || songs.length === 0) return

    const currentSong = songs[currentIndex]
    if (currentSong) {
      const playSong = async () => {
        let songUrl = currentSong.url
        // 如果没有URL，动态获取
        if (!songUrl && currentSong.id) {
          try {
            const response = await fetch(`/api/music/url/${currentSong.id}?br=320`)
            const data = await response.json()
            if (data && data.data && data.data.url) {
              songUrl = data.data.url
              // 更新歌曲URL缓存
              setSongs(prev => prev.map((s, i) =>
                i === currentIndex ? { ...s, url: songUrl } : s
              ))
            }
          } catch (err) {
            console.error('获取播放链接失败:', err)
          }
        }
        if (songUrl) {
          audioRef.current.src = songUrl
          audioRef.current.volume = isMuted ? 0 : volume
          if (isPlaying) {
            audioRef.current.play().catch(() => {})
          }
        }
      }
      playSong()
    }
  }, [currentIndex, songs])

  // 自动播放
  useEffect(() => {
    if (autoplay === 'true' && songs.length > 0 && audioRef.current) {
      const playAttempt = async () => {
        try {
          await audioRef.current.play()
          setIsPlaying(true)
          playerManager.notifyPlay(playerId)
        } catch (e) {
          console.log('自动播放被阻止')
        }
      }
      setTimeout(playAttempt, 500)
    }
  }, [songs, autoplay, playerId])

  // 获取当前歌曲的歌词
  useEffect(() => {
    if (!songs.length || currentIndex >= songs.length) return

    const currentSong = songs[currentIndex]
    const lrcUrl = currentSong?.lrc

    if (!lrcUrl) return
    if (lyricsCache[lrcUrl]) return

    const fetchLyric = async () => {
      try {
        const response = await fetch(lrcUrl)
        const lyricText = await response.text()
        setLyricsCache(prev => ({
          ...prev,
          [lrcUrl]: lyricText
        }))
      } catch (err) {
        console.error('获取歌词失败:', err)
        setLyricsCache(prev => ({
          ...prev,
          [lrcUrl]: ''
        }))
      }
    }

    fetchLyric()
  }, [songs, currentIndex, lyricsCache])

  // 播放/暂停
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      playerManager.notifyStop(playerId)
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
        playerManager.notifyPlay(playerId)
      }).catch(() => {})
    }
  }, [isPlaying, playerId])

  // 进度条点击
  const handleProgressClick = useCallback((e) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  // 进度条拖动
  const progressBarRef = useRef(null)

  const getTimeFromX = useCallback((clientX) => {
    if (!progressBarRef.current) return 0
    const rect = progressBarRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return percent * duration
  }, [duration])

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX)
    if (clientX) {
      const newTime = getTimeFromX(clientX)
      setDragTime(newTime)
    }
  }, [getTimeFromX])

  useEffect(() => {
    if (!isDragging) return

    const handleDragMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX)
      if (clientX) {
        const newTime = getTimeFromX(clientX)
        setDragTime(newTime)
      }
    }

    const handleDragEnd = (e) => {
      const clientX = e.clientX || (e.changedTouches && e.changedTouches[0]?.clientX)
      if (audioRef.current && clientX) {
        const newTime = getTimeFromX(clientX)
        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
      }
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchmove', handleDragMove)
    document.addEventListener('touchend', handleDragEnd)
    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, getTimeFromX])

  // 音量调整
  const handleVolumeChange = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setVolume(percent)
    if (audioRef.current) {
      audioRef.current.volume = percent
    }
    setIsMuted(false)
  }, [])

  // 切换歌曲
  const playSong = useCallback((index) => {
    setCurrentIndex(index)
    setIsPlaying(true)
    playerManager.notifyPlay(playerId)
  }, [playerId])

  // 格式化时间
  const formatTime = (time) => {
    if (!isFinite(time) || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 解析歌词
  const parseLyric = (lrc) => {
    if (!lrc) return []
    const lines = lrc.split('\n')
    const result = []
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

    for (const line of lines) {
      const matches = [...line.matchAll(timeRegex)]
      if (matches.length > 0) {
        const text = line.replace(timeRegex, '').trim()
        if (text) {
          for (const match of matches) {
            const minutes = parseInt(match[1])
            const seconds = parseInt(match[2])
            const ms = parseInt(match[3])
            const time = minutes * 60 + seconds + ms / (match[3].length === 2 ? 100 : 1000)
            result.push({ time, text })
          }
        }
      }
    }
    return result.sort((a, b) => a.time - b.time)
  }

  // 切换歌词显示
  const toggleLyric = useCallback(() => {
    if (!showLyric) {
      // 展开歌词时，先收起播放列表（互斥）
      setShowList(false)
      setShowLyric(true)
      playerManager.expandLyric(playerId)
    } else {
      setShowLyric(false)
      playerManager.collapseLyric(playerId)
    }
  }, [showLyric, playerId])

  // 切换播放列表显示
  const toggleList = useCallback(() => {
    if (songs.length <= 1) return
    if (!showList) {
      // 展开列表时，先收起歌词（互斥）
      setShowLyric(false)
      setShowList(true)
      playerManager.expandList(playerId)
    } else {
      setShowList(false)
      playerManager.collapseList(playerId)
    }
  }, [showList, songs.length, playerId])

  const currentSong = songs[currentIndex]
  const lrcUrl = currentSong?.lrc
  const lyricText = lrcUrl ? (lyricsCache[lrcUrl] || '') : ''
  const lyrics = parseLyric(lyricText)
  const displayTime = isDragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  const getCurrentLyricIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i
      }
    }
    return -1
  }

  const currentLyricIndex = getCurrentLyricIndex()

  if (!id) return null

  return (
    <div className="c-player">
      {/* 歌词区域 */}
      {showLyric && lyrics.length > 0 && (
        <div className="lyric">
          <div
            className="lyric-body"
            ref={lyricBodyRef}
            style={{
              transform: `translateY(${6 - currentLyricIndex * 3}em)`
            }}
          >
            {lyrics.map((line, index) => (
              <span key={index} className={`lyric-line ${index === currentLyricIndex ? 'now' : ''}`}>
                {line.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 控制区域 */}
      <div className="controls">
        <div className="c-left">
          <div className="music-description">
            <div className="image">
              {currentSong?.pic && (
                <img src={currentSong.pic} alt={currentSong.name} />
              )}
            </div>
            <div className="music-meta">
              <div className="music-name">{currentSong?.name || '未知歌曲'}</div>
              <div className="music-artist">{currentSong?.artist || '未知歌手'}</div>
            </div>
          </div>
          <div className="play-icon" onClick={togglePlay}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </div>
        </div>

        <div className="c-center">
          <div className="time">
            <div className="time-body" ref={progressBarRef} onClick={handleProgressClick}>
              <div className={`time-line ${isDragging ? 'dragging' : ''}`} style={{ width: `${progress}%` }}>
                <div className="time-point" onMouseDown={handleDragStart} onTouchStart={handleDragStart}></div>
              </div>
            </div>
            <span className="time-text">
              {formatTime(displayTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="c-right">
          <div className="volume">
            <div className="volume-button">
              <div className="volume-power" onClick={() => setIsMuted(!isMuted)}>
                <VolumeIcon muted={isMuted} />
              </div>
            </div>
            <div className="volume-body" onClick={handleVolumeChange}>
              <div className="volume-line" style={{ width: `${isMuted ? 0 : volume * 100}%` }}>
                <div className="volume-point"></div>
              </div>
            </div>
          </div>

          {lyrics.length > 0 && (
            <div className={`lyric-button ${showLyric ? 'active' : ''}`}>
              <div className="lyric-power" onClick={toggleLyric}>
                <LyricIcon />
              </div>
            </div>
          )}

          <div className={`list-button ${songs.length <= 1 ? 'disabled' : ''} ${showList && songs.length > 1 ? 'active' : ''}`}>
            <div className="list-power" onClick={toggleList}>
              <ListIcon />
            </div>
          </div>
        </div>
      </div>

      {/* 播放列表 */}
      {showList && songs.length > 1 && (
        <div className="list">
          <div className="list-body">
            {songs.map((song, index) => (
              <div
                key={index}
                className={`list-item ${index === currentIndex ? 'active' : ''}`}
                onClick={() => playSong(index)}
              >
                <span className="music-name">{song.name}</span>
                <span className="music-artist">{song.artist}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*/!* 加载状态 *!/*/}
      {/*{loading && (*/}
      {/*  <div className="player-loading-overlay">*/}
      {/*    <span>加载中...</span>*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* 错误状态 */}
      {error && (
        <div className="player-error-overlay">
          <span>{error}</span>
        </div>
      )}
    </div>
  )
})

export default PlayerComponent