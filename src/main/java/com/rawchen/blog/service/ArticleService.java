package com.rawchen.blog.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.dto.ArticleDTO;
import com.rawchen.blog.entity.Article;
import com.rawchen.blog.entity.ArticleVersion;
import com.rawchen.blog.vo.ArticleDetailVO;
import com.rawchen.blog.vo.ArticleEditVO;
import com.rawchen.blog.vo.ArticleVO;

import java.util.List;

/**
 * 文章服务接口
 *
 * @author RawChen
 */
public interface ArticleService {

    /**
     * 分页查询文章列表（前台）
     */
    PageResult<ArticleVO> getArticleList(Long current, Long size, Long categoryId, Long tagId, String keyword);

    /**
     * 获取文章详情（前台）
     */
    ArticleDetailVO getArticleDetail(Long id, String password);

    /**
     * 分页查询文章列表（后台）
     */
    PageResult<ArticleVO> getArticleListAdmin(Long current, Long size, String keyword, Integer status);

    /**
     * 根据ID获取文章
     */
    Article getArticleById(Long id);

    /**
     * 根据ID获取文章编辑信息
     */
    ArticleEditVO getArticleEditById(Long id);

    /**
     * 创建文章
     */
    Long createArticle(ArticleDTO articleDTO);

    /**
     * 更新文章
     */
    void updateArticle(ArticleDTO articleDTO);

    /**
     * 删除文章
     */
    void deleteArticle(Long id);

    /**
     * 增加浏览量
     */
    void incrementViewCount(Long id);

    /**
     * 增加点赞数
     */
    void incrementLikeCount(Long id);

    /**
     * 根据别名获取文章
     */
    ArticleDetailVO getArticleBySlug(String slug);

    /**
     * 搜索文章
     */
    PageResult<ArticleVO> searchArticles(Long current, Long size, String keyword);

    /**
     * 时间线归档
     */
    PageResult<ArticleVO> getArticleTimeline(Long current, Long size);

    /**
     * 随机文章
     */
    List<ArticleVO> getRandomArticles(Integer limit);

    /**
     * 推荐文章
     */
    List<ArticleVO> getRecommendArticles(Integer limit);

    /**
     * 相关文章
     */
    List<ArticleVO> getRelatedArticles(Long articleId, Integer limit);

    /**
     * 最新文章
     */
    List<ArticleVO> getRecentArticles(Integer limit);

    /**
     * 保存草稿
     */
    Long saveDraft(ArticleDTO articleDTO);

    /**
     * 获取草稿
     */
    Article getDraft(Long articleId);

    /**
     * 批量删除文章
     */
    void batchDeleteArticles(List<Long> ids);

    /**
     * 获取文章版本历史
     */
    List<ArticleVersion> getArticleVersions(Long articleId);

    /**
     * 恢复文章到指定版本
     */
    void restoreArticleVersion(Long articleId, Long versionId);

    /**
     * 保存文章版本
     */
    void saveArticleVersion(Article article, Long authorId);
}
