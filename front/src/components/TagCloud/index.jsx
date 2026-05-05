import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTagList } from '../../api/tag'
import './index.css'

function TagCloud({ limit }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const res = await getTagList()
      const tagList = res.data || []
      setTags(limit ? tagList.slice(0, limit) : tagList)
    } catch (e) {
      console.error('加载标签失败', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  return (
    <div className="tag-cloud-wrapper">
      <h3 className="tag-cloud-title">标签云</h3>
      <div className="tag-cloud">
        {tags.map((tag, index) => (
          <Link
            key={tag.id}
            to={`/tag/${tag.id}`}
            className="tag-item"
            style={{
              fontSize: 12 + (tag.articleCount || 0) % 10 + 'px',
              opacity: 0.7 + (tag.articleCount || 0) % 10 * 0.03
            }}
          >
            {tag.tagName}
            <span className="tag-count">{tag.articleCount || 0}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default TagCloud
