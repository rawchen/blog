import React, { useCallback, useMemo, useState } from 'react'
import { message } from 'antd'
import PlayerComponent from '../../components/PlayerComponent'
import { searchMusic, getMusicPlaylist, buildMusicDownloadUrl } from '../../api/music'
import './index.css'

// 空数组需要保持引用稳定，避免触发播放器内部副作用
const EMPTY_SONGS = []

const HOT_KEYWORDS = ['周杰伦', '林俊杰', '陈奕迅', '薛之谦', '邓紫棋', '五月天', '孙燕姿', '华语热歌']

/**
 * 音乐搜索 / 播放 / 下载页
 *
 * - 左侧：搜索结果与歌单歌曲列表
 * - 右侧：波形播放器（复用 PlayerComponent，受控歌曲列表）
 */
const Msou = () => {
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  const [playlistId, setPlaylistId] = useState('')
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [playlistSongs, setPlaylistSongs] = useState([])

  // 当前载入播放器的列表：{ type: 'search' | 'playlist', songs: [] }
  const [playerSource, setPlayerSource] = useState(null)
  // 受控播放位置与触发令牌
  const [playIndex, setPlayIndex] = useState(-1)
  const [playToken, setPlayToken] = useState(0)
  // 正在播放的歌曲ID（用于列表高亮）
  const [currentSongId, setCurrentSongId] = useState(null)

  const playerSongs = playerSource ? playerSource.songs : EMPTY_SONGS

  // 搜索网易云音乐
  const handleSearch = useCallback(async (target) => {
    const kw = (target !== undefined ? target : keyword).trim()
    if (!kw) {
      message.warning('请输入搜索关键词')
      return
    }
    setSearching(true)
    try {
      const res = await searchMusic(kw, 30)
      const list = Array.isArray(res?.data) ? res.data : []
      setResults(list)
      setSearched(true)
      if (!list.length) {
        message.info('未找到相关音乐')
      }
    } catch (error) {
      // 错误提示已由 request 拦截器统一处理
    } finally {
      setSearching(false)
    }
  }, [keyword])

  // 加载歌单
  const handleLoadPlaylist = useCallback(async () => {
    const id = playlistId.trim()
    if (!id) {
      message.warning('请输入歌单ID')
      return
    }
    setPlaylistLoading(true)
    try {
      const res = await getMusicPlaylist(id)
      const list = Array.isArray(res?.data) ? res.data : []
      setPlaylistSongs(list)
      if (!list.length) {
        message.info('歌单为空或不存在')
      }
    } catch (error) {
      // 错误提示已由 request 拦截器统一处理
    } finally {
      setPlaylistLoading(false)
    }
  }, [playlistId])

  // 播放列表中的某一首
  const handlePlay = useCallback((song, index, type) => {
    const songs = type === 'playlist' ? playlistSongs : results
    if (!songs.length) return
    setPlayerSource({ type, songs })
    setPlayIndex(index)
    setPlayToken(prev => prev + 1)
  }, [results, playlistSongs])

  // 播放整个列表
  const handlePlayAll = useCallback((type) => {
    const songs = type === 'playlist' ? playlistSongs : results
    if (!songs.length) {
      message.info(type === 'playlist' ? '请先加载歌单' : '请先搜索歌曲')
      return
    }
    setPlayerSource({ type, songs })
    setPlayIndex(0)
    setPlayToken(prev => prev + 1)
  }, [results, playlistSongs])

  // 下载歌曲（服务端代理转发，跨域同样可以正常下载）
  const handleDownload = useCallback((song) => {
    if (!song?.id) return
    const fileName = song.artist ? `${song.name} - ${song.artist}` : song.name
    const link = document.createElement('a')
    link.href = buildMusicDownloadUrl(song.id, fileName, 320)
    link.download = `${fileName}.mp3`
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success(`已开始下载：${fileName}`)
  }, [])

  // 播放器切歌回调
  const handleSongChange = useCallback((song) => {
    setCurrentSongId(song?.id || null)
  }, [])

  const resultSourceLabel = useMemo(() => {
    if (playerSource?.type === 'playlist') return '歌单'
    if (playerSource?.type === 'search') return '搜索结果'
    return ''
  }, [playerSource])

  const renderSongRow = (song, index, type) => {
    const active = currentSongId && song.id === currentSongId
    return (
      <li
        key={`${type}-${song.id}-${index}`}
        className={`msou-song-item${active ? ' active' : ''}`}
      >
        <span className="msou-song-index">{index + 1}</span>
        {song.pic ? (
          <img
            className="msou-song-cover"
            src={song.pic}
            alt={song.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={e => { e.currentTarget.style.visibility = 'hidden' }}
          />
        ) : (
          <span className="msou-song-cover msou-song-cover-empty">
            <span className="msou-icon-note" />
          </span>
        )}
        <div className="msou-song-info">
          <div className="msou-song-name" title={song.name}>{song.name}</div>
          <div className="msou-song-meta">
            <span title={song.artist}>{song.artist || '未知歌手'}</span>
            {song.album ? <><i className="msou-dot" />{song.album}</> : null}
          </div>
        </div>
        <div className="msou-song-actions">
          <button
            type="button"
            className="msou-btn msou-btn-play"
            onClick={() => handlePlay(song, index, type)}
            title="播放"
          >
            {active ? '暂停' : '播放'}
          </button>
          <button
            type="button"
            className="msou-btn msou-btn-download"
            onClick={() => handleDownload(song)}
            title="下载"
          >
            下载
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="msou-page">
      <section className="msou-hero">
        <h1 className="msou-hero-title">
          <span className="msou-icon-note" />
          音乐搜索
        </h1>
        <p className="msou-hero-desc">
          搜索网易云音乐歌曲，在线试听（波形可视化播放），并一键下载 mp3 音源。
        </p>
      </section>

      <div className="msou-layout">
        <div className="msou-main">
          {/* 搜索框 */}
          <section className="msou-card msou-search-card">
            <form
              className="msou-search-form"
              onSubmit={e => {
                e.preventDefault()
                handleSearch()
              }}
            >
              <input
                className="msou-search-input"
                type="text"
                value={keyword}
                placeholder="输入歌名 / 歌手，例如：晴天"
                onChange={e => setKeyword(e.target.value)}
                maxLength={50}
              />
              <button className="msou-btn msou-btn-primary" type="submit" disabled={searching}>
                {searching ? '搜索中...' : '搜索'}
              </button>
            </form>
            <div className="msou-hot">
              <span className="msou-hot-label">热门：</span>
              {HOT_KEYWORDS.map(item => (
                <button
                  key={item}
                  type="button"
                  className="msou-hot-tag"
                  onClick={() => {
                    setKeyword(item)
                    handleSearch(item)
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {/* 搜索结果 */}
          <section className="msou-card">
            <div className="msou-card-head">
              <h2 className="msou-card-title">
                搜索结果
                {results.length ? <span className="msou-count">{results.length}</span> : null}
              </h2>
              {results.length ? (
                <button type="button" className="msou-link-btn" onClick={() => handlePlayAll('search')}>
                  播放全部
                </button>
              ) : null}
            </div>

            {!searched ? (
              <div className="msou-empty">输入关键词开始搜索，结果会显示在这里</div>
            ) : results.length ? (
              <ul className="msou-song-list">{results.map((song, index) => renderSongRow(song, index, 'search'))}</ul>
            ) : (
              <div className="msou-empty">没有找到相关歌曲，换个关键词试试吧</div>
            )}
          </section>

          {/* 歌单 */}
          <section className="msou-card">
            <div className="msou-card-head">
              <h2 className="msou-card-title">
                歌单
                {playlistSongs.length ? <span className="msou-count">{playlistSongs.length}</span> : null}
              </h2>
              {playlistSongs.length ? (
                <button type="button" className="msou-link-btn" onClick={() => handlePlayAll('playlist')}>
                  播放全部
                </button>
              ) : null}
            </div>

            <div className="msou-playlist-form">
              <input
                className="msou-search-input"
                type="text"
                value={playlistId}
                placeholder="输入网易云歌单ID"
                onChange={e => setPlaylistId(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleLoadPlaylist()
                  }
                }}
              />
              <button
                type="button"
                className="msou-btn msou-btn-primary"
                onClick={handleLoadPlaylist}
                disabled={playlistLoading}
              >
                {playlistLoading ? '加载中...' : '加载歌单'}
              </button>
            </div>

            {playlistSongs.length ? (
              <ul className="msou-song-list">
                {playlistSongs.map((song, index) => renderSongRow(song, index, 'playlist'))}
              </ul>
            ) : (
              <div className="msou-empty">加载歌单后，可整单播放或单曲下载</div>
            )}
          </section>
        </div>

        {/* 播放器 */}
        <aside className="msou-aside">
          <section className="msou-card msou-player-card">
            <div className="msou-card-head">
              <h2 className="msou-card-title">正在播放</h2>
              {resultSourceLabel ? <span className="msou-source-label">{resultSourceLabel}</span> : null}
            </div>

            {playerSongs.length ? (
              <PlayerComponent
                songs={playerSongs}
                playIndex={playIndex}
                playToken={playToken}
                onSongChange={handleSongChange}
              />
            ) : (
              <div className="msou-empty msou-player-empty">
                还没有选择歌曲<br />
                搜索后点击「播放」，这里会出现波形播放器
              </div>
            )}
          </section>

          <section className="msou-card msou-tips">
            <h2 className="msou-card-title">使用说明</h2>
            <ul>
              <li>搜索结果来自网易云音乐公开接口，部分歌曲为 VIP 曲目，可能无法播放或下载。</li>
              <li>点击歌曲右侧「播放」，波形进度条支持点击 / 拖动跳转。</li>
              <li>点击「下载」会通过服务端代理获取 mp3 音源，文件名格式为「歌名 - 歌手」。</li>
              <li>下载的音频仅供个人学习试听，请勿用于商业用途。</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default Msou
