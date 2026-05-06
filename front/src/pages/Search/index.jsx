import React, { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { getArticleList } from '../../api/article'
import { getTagList } from '../../api/tag'
import './index.css'

// Random background colors for tags
const bgColors = ['bg-blue', 'bg-orange', 'bg-green', 'bg-yellow', 'bg-purple', 'bg-red']
const getBgColor = (index) => bgColors[index % bgColors.length]

function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const keyword = searchParams.get('q') || ''

  const [query, setQuery] = useState(keyword)
  const [results, setResults] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetchTags()
    if (keyword) {
      setQuery(keyword)
      handleSearch(keyword)
    }
  }, [keyword])

  const fetchTags = async () => {
    try {
      const res = await getTagList()
      setTags(res.data || [])
    } catch (error) {
      // error handled
    }
  }

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setSearched(true)
    try {
      const res = await getArticleList({
        current: 1,
        size: 20,
        keyword: searchQuery
      })
      setResults(res.data?.records || [])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
      handleSearch(query)
    }
  }

  const handleTagClick = (tagName) => {
    navigate(`/tag?name=${encodeURIComponent(tagName)}`)
  }

  return (
    <div className="search-page">
      {/* Header */}
      <div className="search-header">
        <h1>搜索</h1>
      </div>

      {/* Search Form */}
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            maxLength={30}
            autoComplete="off"
          />
          <button type="submit">
            <i className="fa fa-search"></i>
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searched && (
        <div className="search-results">
          {loading ? (
            <div className="loading">搜索中...</div>
          ) : results.length > 0 ? (
            <>
              <div className="search-results-title">
                找到 <span>{results.length}</span> 个相关结果
              </div>
              <div className="post-lists">
                <div className="post-lists-body clearfix">
                  {results.map((article, index) => (
                    <div key={article.id} className="post-list-item">
                      <div className={`post-list-item-container ${getBgColor(index)}`}>
                        <Link to={`/${article.id}`}>
                          <div className="item-label">
                            <div className="item-title">
                              <a>{article.title}</a>
                            </div>
                            <div className="item-meta">
                              <i className="fa fa-clock-o" aria-hidden="true"></i>
                              {article.publishTime || article.createTime}
                              {article.categoryName && (
                                <>
                                  <span style={{ margin: '0 5px' }}>·</span>
                                  <i className="fa fa-folder-o" aria-hidden="true"></i>
                                  {article.categoryName}
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="no-results">
              <i className="fa fa-search" aria-hidden="true"></i>
              <p>没有找到任何内容哦, 请换个别的关键字再试试</p>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="search-divider"></div>

      {/* Tag Cloud */}
      <div className="tag-cloud-section">
        <h3>热门标签</h3>
        <div className="tag-cloud">
          {tags.map((tag, index) => (
            <Link
              key={tag.id}
              to={`/tag/${tag.id}`}
              className="tag-cloud-item"
              style={{ background: undefined }}
            >
              {tag.tagName} ({tag.articleCount || 0})
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SearchPage
