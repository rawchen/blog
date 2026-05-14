import React from 'react'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import FriendsPage from '../Friends'
import MomentsPage from '../Moments'
import SearchPage from '../Search'
import ArchivePage from '../Archive'
import './index.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock, faComment, faEye} from "@fortawesome/free-regular-svg-icons";
import {Link} from "react-router-dom";

// 模板组件映射
const templateComponents = {
  'friends': FriendsPage,
  'moments': MomentsPage,
  'search': SearchPage,
  'archive': ArchivePage
}

function PageDetail({ page }) {
  if (!page) {
    return <div className="page-not-found">页面不存在</div>
  }

  // 如果有模板，使用模板组件
  if (page.template && templateComponents[page.template]) {
    const TemplateComponent = templateComponents[page.template]
    return <TemplateComponent pageContent={page} />
  }

  // 默认模板：渲染Markdown内容
  return (
    <div className="page-detail">
      <div className="page-header">
        <h1 className="page-title">{page.title}</h1>
        {/*<div className="page-meta">*/}
        {/*  <span>浏览：{page.viewCount || 0}</span>*/}
        {/*  {page.updateTime && (*/}
        {/*    <span>更新于：{new Date(page.updateTime).toLocaleDateString('zh-CN')}</span>*/}
        {/*  )}*/}
        {/*</div>*/}
        <div className="page-meta">
          <span className="meta-item">
            <FontAwesomeIcon icon={faClock} className="fa-icon" />
            {new Date(page.publishTime).toLocaleDateString('zh-CN')}
          </span>
          <span className="meta-item">
                  <FontAwesomeIcon icon={faComment} className="fa-icon" />
                  <Link to="#comments">{page.commentCount || 0} 评论</Link>
                </span>
          <span className="meta-item">
                  <FontAwesomeIcon icon={faEye} className="fa-icon" />
            {page.viewCount || 0} 浏览
                </span>
        </div>
      </div>
      <div className="page-content">
        {page.content ? (
          <MarkdownRenderer content={page.content} />
        ) : (
          <div className="page-empty">暂无内容</div>
        )}
      </div>
    </div>
  )
}

export default PageDetail
