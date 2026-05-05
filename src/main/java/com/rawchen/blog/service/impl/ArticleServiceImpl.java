package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.ResultCode;
import com.rawchen.blog.dto.ArticleDTO;
import com.rawchen.blog.entity.*;
import com.rawchen.blog.exception.BusinessException;
import com.rawchen.blog.mapper.*;
import com.rawchen.blog.service.ArticleService;
import com.rawchen.blog.vo.ArticleDetailVO;
import com.rawchen.blog.vo.ArticleEditVO;
import com.rawchen.blog.vo.ArticleVO;
import com.rawchen.blog.vo.TagVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 文章服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    private ArticleMapper articleMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private TagMapper tagMapper;

    @Autowired
    private ArticleTagMapper articleTagMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ArticleVersionMapper articleVersionMapper;

    @Override
    public PageResult<ArticleVO> getArticleList(Long current, Long size, Long categoryId, Long tagId, String keyword) {
        Page<Article> page = new Page<>(current, size);
        
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getStatus, 1) // 已发布
                .orderByDesc(Article::getIsTop)
                .orderByDesc(Article::getPublishTime);

        // 分类筛选
        if (categoryId != null) {
            wrapper.eq(Article::getCategoryId, categoryId);
        }

        // 关键词搜索
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Article::getTitle, keyword)
                    .or()
                    .like(Article::getSummary, keyword));
        }

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);
        
        // 转换为VO
        List<ArticleVO> voList = articlePage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(new Page<ArticleVO>()
                .setRecords(voList)
                .setCurrent(articlePage.getCurrent())
                .setSize(articlePage.getSize())
                .setTotal(articlePage.getTotal())
                .setPages(articlePage.getPages()));
    }

    @Override
    public ArticleDetailVO getArticleDetail(Long id, String password) {
        Article article = articleMapper.selectById(id);
        if (article == null || article.getStatus() != 1) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // 检查密码
        if (StringUtils.hasText(article.getPassword())) {
            if (!article.getPassword().equals(password)) {
                throw new BusinessException("文章需要密码访问");
            }
        }

        ArticleDetailVO detailVO = new ArticleDetailVO();
        BeanUtils.copyProperties(convertToVO(article), detailVO);
        detailVO.setContent(article.getContent());
        detailVO.setContentHtml(article.getContentHtml());

        // 查询上一篇下一篇
        Article prevArticle = articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1)
                .lt(Article::getPublishTime, article.getPublishTime())
                .orderByDesc(Article::getPublishTime)
                .last("LIMIT 1"));
        
        if (prevArticle != null) {
            ArticleVO prevVO = new ArticleVO();
            prevVO.setId(prevArticle.getId());
            prevVO.setTitle(prevArticle.getTitle());
            prevVO.setCoverImage(prevArticle.getCoverImage());
            detailVO.setPrevArticle(prevVO);
        }

        Article nextArticle = articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1)
                .gt(Article::getPublishTime, article.getPublishTime())
                .orderByAsc(Article::getPublishTime)
                .last("LIMIT 1"));
        
        if (nextArticle != null) {
            ArticleVO nextVO = new ArticleVO();
            nextVO.setId(nextArticle.getId());
            nextVO.setTitle(nextArticle.getTitle());
            nextVO.setCoverImage(nextArticle.getCoverImage());
            detailVO.setNextArticle(nextVO);
        }

        return detailVO;
    }

    @Override
    public PageResult<ArticleVO> getArticleListAdmin(Long current, Long size, String keyword, Integer status) {
        Page<Article> page = new Page<>(current, size);
        
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Article::getCreateTime);

        if (status != null) {
            wrapper.eq(Article::getStatus, status);
        }

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Article::getTitle, keyword)
                    .or()
                    .like(Article::getSummary, keyword));
        }

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);
        
        List<ArticleVO> voList = articlePage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(new Page<ArticleVO>()
                .setRecords(voList)
                .setCurrent(articlePage.getCurrent())
                .setSize(articlePage.getSize())
                .setTotal(articlePage.getTotal())
                .setPages(articlePage.getPages()));
    }

    @Override
    public Article getArticleById(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        return article;
    }

    @Override
    public ArticleEditVO getArticleEditById(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        ArticleEditVO vo = new ArticleEditVO();
        BeanUtils.copyProperties(article, vo);

        // 查询文章关联的标签ID
        List<ArticleTag> articleTags = articleTagMapper.selectList(new LambdaQueryWrapper<ArticleTag>()
                .eq(ArticleTag::getArticleId, id));

        if (!CollectionUtils.isEmpty(articleTags)) {
            List<Long> tagIds = articleTags.stream()
                    .map(ArticleTag::getTagId)
                    .collect(Collectors.toList());
            vo.setTagIds(tagIds);
        }

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createArticle(ArticleDTO articleDTO) {
        Article article = new Article();
        BeanUtils.copyProperties(articleDTO, article);

        // Boolean 转 Integer
        article.setIsTop(articleDTO.getIsTop() != null && articleDTO.getIsTop() ? 1 : 0);
        article.setIsRecommend(articleDTO.getIsRecommend() != null && articleDTO.getIsRecommend() ? 1 : 0);
        article.setAllowComment(articleDTO.getAllowComment() == null || articleDTO.getAllowComment() ? 1 : 0);

        // 获取当前用户ID
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, auth.getName()));
        article.setAuthorId(user.getId());

        // 设置发布时间
        if (articleDTO.getStatus() == 1) {
            if (articleDTO.getPublishTime() != null) {
                article.setPublishTime(articleDTO.getPublishTime());
            } else {
                article.setPublishTime(LocalDateTime.now());
            }
        }

        article.setViewCount(0);
        article.setLikeCount(0);
        article.setCommentCount(0);

        articleMapper.insert(article);
        log.info("创建文章成功: {}", article.getTitle());

        // 保存文章版本
        saveArticleVersion(article, user.getId());

        // 处理新标签创建
        List<Long> allTagIds = new ArrayList<>();
        if (!CollectionUtils.isEmpty(articleDTO.getTagIds())) {
            allTagIds.addAll(articleDTO.getTagIds());
        }
        if (!CollectionUtils.isEmpty(articleDTO.getNewTags())) {
            for (String tagName : articleDTO.getNewTags()) {
                // 检查标签是否已存在
                Tag existingTag = tagMapper.selectOne(new LambdaQueryWrapper<Tag>()
                        .eq(Tag::getTagName, tagName));
                if (existingTag != null) {
                    // 标签已存在，使用现有ID
                    if (!allTagIds.contains(existingTag.getId())) {
                        allTagIds.add(existingTag.getId());
                    }
                } else {
                    // 创建新标签
                    Tag newTag = new Tag();
                    newTag.setTagName(tagName);
                    newTag.setTagSlug(tagName.toLowerCase().replace(" ", "-"));
                    newTag.setStatus(1);
                    newTag.setArticleCount(0);
                    tagMapper.insert(newTag);
                    allTagIds.add(newTag.getId());
                    log.info("创建新标签: {}", tagName);
                }
            }
        }

        // 保存标签关联
        for (Long tagId : allTagIds) {
            ArticleTag articleTag = new ArticleTag();
            articleTag.setArticleId(article.getId());
            articleTag.setTagId(tagId);
            articleTagMapper.insert(articleTag);
        }

        return article.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateArticle(ArticleDTO articleDTO) {
        Article article = articleMapper.selectById(articleDTO.getId());
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // 获取当前用户
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, auth.getName()));

        // 保存旧版本
        saveArticleVersion(article, user.getId());

        BeanUtils.copyProperties(articleDTO, article);

        // Boolean 转 Integer
        article.setIsTop(articleDTO.getIsTop() != null && articleDTO.getIsTop() ? 1 : 0);
        article.setIsRecommend(articleDTO.getIsRecommend() != null && articleDTO.getIsRecommend() ? 1 : 0);
        article.setAllowComment(articleDTO.getAllowComment() == null || articleDTO.getAllowComment() ? 1 : 0);

        // 处理发布时间
        if (articleDTO.getPublishTime() != null) {
            article.setPublishTime(articleDTO.getPublishTime());
        } else if (article.getStatus() != 1 && articleDTO.getStatus() == 1) {
            // 从草稿发布时设置发布时间
            article.setPublishTime(LocalDateTime.now());
        }

        articleMapper.updateById(article);
        log.info("更新文章成功: {}", article.getTitle());

        // 更新标签关联
        articleTagMapper.delete(new LambdaQueryWrapper<ArticleTag>()
                .eq(ArticleTag::getArticleId, article.getId()));

        // 处理新标签创建
        List<Long> allTagIds = new ArrayList<>();
        if (!CollectionUtils.isEmpty(articleDTO.getTagIds())) {
            allTagIds.addAll(articleDTO.getTagIds());
        }
        if (!CollectionUtils.isEmpty(articleDTO.getNewTags())) {
            for (String tagName : articleDTO.getNewTags()) {
                // 检查标签是否已存在
                Tag existingTag = tagMapper.selectOne(new LambdaQueryWrapper<Tag>()
                        .eq(Tag::getTagName, tagName));
                if (existingTag != null) {
                    // 标签已存在，使用现有ID
                    if (!allTagIds.contains(existingTag.getId())) {
                        allTagIds.add(existingTag.getId());
                    }
                } else {
                    // 创建新标签
                    Tag newTag = new Tag();
                    newTag.setTagName(tagName);
                    newTag.setTagSlug(tagName.toLowerCase().replace(" ", "-"));
                    newTag.setStatus(1);
                    newTag.setArticleCount(0);
                    tagMapper.insert(newTag);
                    allTagIds.add(newTag.getId());
                    log.info("创建新标签: {}", tagName);
                }
            }
        }

        // 保存标签关联
        for (Long tagId : allTagIds) {
            ArticleTag articleTag = new ArticleTag();
            articleTag.setArticleId(article.getId());
            articleTag.setTagId(tagId);
            articleTagMapper.insert(articleTag);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteArticle(Long id) {
        articleMapper.deleteById(id);
        articleTagMapper.delete(new LambdaQueryWrapper<ArticleTag>()
                .eq(ArticleTag::getArticleId, id));
        log.info("删除文章成功: {}", id);
    }

    @Override
    public void incrementViewCount(Long id) {
        Article article = articleMapper.selectById(id);
        if (article != null) {
            article.setViewCount(article.getViewCount() + 1);
            articleMapper.updateById(article);
        }
    }

    @Override
    public void incrementLikeCount(Long id) {
        Article article = articleMapper.selectById(id);
        if (article != null) {
            article.setLikeCount(article.getLikeCount() + 1);
            articleMapper.updateById(article);
        }
    }

    @Override
    public ArticleDetailVO getArticleBySlug(String slug) {
        Article article = articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                .eq(Article::getSlug, slug)
                .eq(Article::getStatus, 1));
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        return getArticleDetail(article.getId(), null);
    }

    @Override
    public PageResult<ArticleVO> searchArticles(Long current, Long size, String keyword) {
        Page<Article> page = new Page<>(current, size);

        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getStatus, 1);

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Article::getTitle, keyword)
                    .or()
                    .like(Article::getSummary, keyword)
                    .or()
                    .like(Article::getContent, keyword));
        }

        wrapper.orderByDesc(Article::getPublishTime);

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);

        List<ArticleVO> voList = articlePage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(new Page<ArticleVO>()
                .setRecords(voList)
                .setCurrent(articlePage.getCurrent())
                .setSize(articlePage.getSize())
                .setTotal(articlePage.getTotal())
                .setPages(articlePage.getPages()));
    }

    @Override
    public PageResult<ArticleVO> getArticleTimeline(Long current, Long size) {
        Page<Article> page = new Page<>(current, size);

        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getStatus, 1)
                .orderByDesc(Article::getPublishTime);

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);

        List<ArticleVO> voList = articlePage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(new Page<ArticleVO>()
                .setRecords(voList)
                .setCurrent(articlePage.getCurrent())
                .setSize(articlePage.getSize())
                .setTotal(articlePage.getTotal())
                .setPages(articlePage.getPages()));
    }

    @Override
    public List<ArticleVO> getRandomArticles(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 5;
        }

        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1)
                .last("ORDER BY RAND() LIMIT " + limit));

        return articles.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ArticleVO> getRecommendArticles(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 5;
        }

        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1)
                .eq(Article::getIsRecommend, 1)
                .orderByDesc(Article::getPublishTime)
                .last("LIMIT " + limit));

        return articles.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ArticleVO> getRelatedArticles(Long articleId, Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 5;
        }

        // 获取当前文章的标签
        List<ArticleTag> articleTags = articleTagMapper.selectList(new LambdaQueryWrapper<ArticleTag>()
                .eq(ArticleTag::getArticleId, articleId));

        if (CollectionUtils.isEmpty(articleTags)) {
            return new ArrayList<>();
        }

        List<Long> tagIds = articleTags.stream()
                .map(ArticleTag::getTagId)
                .collect(Collectors.toList());

        // 获取有相同标签的文章ID
        List<ArticleTag> relatedTags = articleTagMapper.selectList(new LambdaQueryWrapper<ArticleTag>()
                .in(ArticleTag::getTagId, tagIds)
                .ne(ArticleTag::getArticleId, articleId));

        if (CollectionUtils.isEmpty(relatedTags)) {
            return new ArrayList<>();
        }

        List<Long> relatedArticleIds = relatedTags.stream()
                .map(ArticleTag::getArticleId)
                .distinct()
                .limit(limit)
                .collect(Collectors.toList());

        // 查询文章
        List<Article> articles = articleMapper.selectBatchIds(relatedArticleIds);

        return articles.stream()
                .filter(a -> a.getStatus() == 1)
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long saveDraft(ArticleDTO articleDTO) {
        Article article = new Article();
        BeanUtils.copyProperties(articleDTO, article);

        article.setStatus(0); // 草稿状态

        // Boolean 转 Integer
        article.setIsTop(articleDTO.getIsTop() != null && articleDTO.getIsTop() ? 1 : 0);
        article.setIsRecommend(articleDTO.getIsRecommend() != null && articleDTO.getIsRecommend() ? 1 : 0);
        article.setAllowComment(articleDTO.getAllowComment() == null || articleDTO.getAllowComment() ? 1 : 0);

        // 获取当前用户ID
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, auth.getName()));
        article.setAuthorId(user.getId());

        article.setViewCount(0);
        article.setLikeCount(0);
        article.setCommentCount(0);

        articleMapper.insert(article);
        log.info("保存草稿成功: {}", article.getTitle());

        return article.getId();
    }

    @Override
    public Article getDraft(Long articleId) {
        return articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                .eq(Article::getId, articleId)
                .eq(Article::getStatus, 0)); // 草稿状态
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDeleteArticles(List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) {
            return;
        }
        articleMapper.deleteBatchIds(ids);

        // 删除文章标签关联
        for (Long id : ids) {
            articleTagMapper.delete(new LambdaQueryWrapper<ArticleTag>()
                    .eq(ArticleTag::getArticleId, id));
        }
        log.info("批量删除文章成功: {}", ids);
    }

    @Override
    public List<ArticleVersion> getArticleVersions(Long articleId) {
        return articleVersionMapper.selectList(new LambdaQueryWrapper<ArticleVersion>()
                .eq(ArticleVersion::getArticleId, articleId)
                .orderByDesc(ArticleVersion::getVersion));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void restoreArticleVersion(Long articleId, Long versionId) {
        ArticleVersion version = articleVersionMapper.selectById(versionId);
        if (version == null || !version.getArticleId().equals(articleId)) {
            throw new BusinessException("版本不存在");
        }

        Article article = articleMapper.selectById(articleId);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // 获取当前用户
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, auth.getName()));

        // 保存当前版本
        saveArticleVersion(article, user.getId());

        // 恢复历史版本
        article.setTitle(version.getTitle());
        article.setContent(version.getContent());
        article.setSummary(version.getSummary());
        // contentHtml 由前端渲染

        articleMapper.updateById(article);
        log.info("恢复文章版本成功: articleId={}, versionId={}", articleId, versionId);
    }

    @Override
    public void saveArticleVersion(Article article, Long authorId) {
        if (!StringUtils.hasText(article.getContent())) {
            return;
        }

        // 获取当前最大版本号
        Integer maxVersion = articleVersionMapper.getMaxVersion(article.getId());
        int nextVersion = (maxVersion == null ? 0 : maxVersion) + 1;

        ArticleVersion version = new ArticleVersion();
        version.setArticleId(article.getId());
        version.setVersion(nextVersion);
        version.setTitle(article.getTitle());
        version.setContent(article.getContent());
        version.setSummary(article.getSummary());
        version.setAuthorId(authorId);

        articleVersionMapper.insert(version);
        log.debug("保存文章版本: articleId={}, version={}", article.getId(), nextVersion);
    }

    /**
     * 转换为VO
     */
    private ArticleVO convertToVO(Article article) {
        ArticleVO vo = new ArticleVO();
        BeanUtils.copyProperties(article, vo);

        // 设置分类名称
        if (article.getCategoryId() != null) {
            Category category = categoryMapper.selectById(article.getCategoryId());
            if (category != null) {
                vo.setCategoryName(category.getCategoryName());
            }
        }

        // 设置作者信息
        if (article.getAuthorId() != null) {
            User author = userMapper.selectById(article.getAuthorId());
            if (author != null) {
                vo.setAuthorName(author.getNickname());
                vo.setAuthorAvatar(author.getAvatar());
            }
        }

        // 查询标签
        List<ArticleTag> articleTags = articleTagMapper.selectList(new LambdaQueryWrapper<ArticleTag>()
                .eq(ArticleTag::getArticleId, article.getId()));
        
        if (!CollectionUtils.isEmpty(articleTags)) {
            List<Long> tagIds = articleTags.stream()
                    .map(ArticleTag::getTagId)
                    .collect(Collectors.toList());
            
            List<Tag> tags = tagMapper.selectBatchIds(tagIds);
            List<TagVO> tagVOs = tags.stream().map(tag -> {
                TagVO tagVO = new TagVO();
                BeanUtils.copyProperties(tag, tagVO);
                return tagVO;
            }).collect(Collectors.toList());
            vo.setTags(tagVOs);
        }

        // 是否有密码
        vo.setHasPassword(StringUtils.hasText(article.getPassword()));

        return vo;
    }
}
