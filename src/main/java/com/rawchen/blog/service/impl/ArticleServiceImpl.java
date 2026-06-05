package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.ResultCode;
import com.rawchen.blog.dto.ArticleDTO;
import com.rawchen.blog.dto.LatestArticleDTO;
import com.rawchen.blog.dto.PageDTO;
import com.rawchen.blog.entity.*;
import com.rawchen.blog.exception.BusinessException;
import com.rawchen.blog.mapper.*;
import com.rawchen.blog.service.ArticleService;
import com.rawchen.blog.service.ConfigService;
import com.rawchen.blog.vo.ArticleDetailVO;
import com.rawchen.blog.vo.ArticleEditVO;
import com.rawchen.blog.vo.ArticleVO;
import com.rawchen.blog.vo.ArchiveVO;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 文章服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class ArticleServiceImpl extends ServiceImpl<ArticleMapper, Article> implements ArticleService {

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

    @Autowired
    private ConfigService configService;

    @Override
    public PageResult<ArticleVO> getArticleList(Long current, Long size, Long categoryId, Long tagId, String keyword) {
        // 从系统配置获取分页大小，默认10
        Long pageSize = size;
        if (pageSize == null || pageSize <= 0) {
            String configSize = configService.getConfigByKey("article_page_size", "10");
            try {
                pageSize = Long.parseLong(configSize);
            } catch (NumberFormatException e) {
                pageSize = 10L;
            }
        }

        Page<Article> page = new Page<>(current, pageSize);

        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Article::getStatus, 1, 2) // 发布或加密
                .eq(Article::getType, Article.ArticleType.POST) // 只查询普通文章
                .orderByDesc(Article::getIsTop)
                .orderByDesc(Article::getPublishTime);

        // 分类筛选
        if (categoryId != null) {
            wrapper.eq(Article::getCategoryId, categoryId);
        }

        // 标签筛选（通过关联表查询文章ID）
        if (tagId != null) {
            List<ArticleTag> articleTags = articleTagMapper.selectList(new LambdaQueryWrapper<ArticleTag>()
                    .eq(ArticleTag::getTagId, tagId));
            if (!CollectionUtils.isEmpty(articleTags)) {
                List<Long> articleIds = articleTags.stream()
                        .map(ArticleTag::getArticleId)
                        .collect(Collectors.toList());
                wrapper.in(Article::getId, articleIds);
            } else {
                // 该标签下没有文章，返回空结果
                return PageResult.of(new Page<ArticleVO>()
                        .setRecords(new ArrayList<>())
                        .setCurrent(current)
                        .setSize(size)
                        .setTotal(0L)
                        .setPages(0L));
            }
        }

        // 关键词搜索
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Article::getTitle, keyword)
                    .or()
                    .like(Article::getSummary, keyword));
        }

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);

        // 批量转换为VO（轻量级，不查询标签和内容）
        List<ArticleVO> voList = batchConvertToListVO(articlePage.getRecords());

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
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // 状态判断：0-待审、4-私密完全不可访问
        Integer status = article.getStatus();
        if (status == 0 || status == 4) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        ArticleDetailVO detailVO = new ArticleDetailVO();
        BeanUtils.copyProperties(convertToVO(article), detailVO);

        // 状态2-加密：检查密码
        if (status == 2 && StringUtils.hasText(article.getPassword())) {
            if (!article.getPassword().equals(password)) {
                // 密码不匹配：返回基本信息，标记需要密码
                detailVO.setNeedPassword(true);
                detailVO.setContent(null);
                detailVO.setContentHtml(null);
                return detailVO;
            }
        }

        // 状态1-发布、3-隐藏、2-加密(密码正确)：返回完整内容
        detailVO.setContent(article.getContent());
        detailVO.setContentHtml(article.getContentHtml());

        // 查询上一篇下一篇（发布或加密的文章）
        Article prevArticle = articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                .in(Article::getStatus, 1, 2)
                .eq(Article::getType, Article.ArticleType.POST)
                .lt(Article::getPublishTime, article.getPublishTime())
                .orderByDesc(Article::getPublishTime)
                .last("LIMIT 1"));

        if (prevArticle != null) {
            ArticleVO prevVO = new ArticleVO();
            prevVO.setId(prevArticle.getId());
            prevVO.setTitle(prevArticle.getTitle());
            String prevCover = prevArticle.getCoverImage();
            if (!StringUtils.hasText(prevCover) && StringUtils.hasText(prevArticle.getContent())) {
                String firstImage = extractFirstImage(prevArticle.getContent());
                if (firstImage != null) {
                    prevCover = firstImage;
                }
            }
            prevVO.setCoverImage(prevCover);
            detailVO.setPrevArticle(prevVO);
        }

        Article nextArticle = articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                .in(Article::getStatus, 1, 2)
                .eq(Article::getType, Article.ArticleType.POST)
                .gt(Article::getPublishTime, article.getPublishTime())
                .orderByAsc(Article::getPublishTime)
                .last("LIMIT 1"));

        if (nextArticle != null) {
            ArticleVO nextVO = new ArticleVO();
            nextVO.setId(nextArticle.getId());
            nextVO.setTitle(nextArticle.getTitle());
            String nextCover = nextArticle.getCoverImage();
            if (!StringUtils.hasText(nextCover) && StringUtils.hasText(nextArticle.getContent())) {
                String firstImage = extractFirstImage(nextArticle.getContent());
                if (firstImage != null) {
                    nextCover = firstImage;
                }
            }
            nextVO.setCoverImage(nextCover);
            detailVO.setNextArticle(nextVO);
        }

        return detailVO;
    }

    @Override
    public PageResult<ArticleVO> getArticleListAdmin(Long current, Long size, String keyword, Integer status, String startTime, String endTime) {
        Page<Article> page = new Page<>(current, size);

        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getType, Article.ArticleType.POST) // 只查询普通文章，过滤掉独立页面
                .orderByDesc(Article::getCreateTime);

        if (status != null) {
            wrapper.eq(Article::getStatus, status);
        }

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Article::getTitle, keyword)
                    .or()
                    .like(Article::getSummary, keyword));
        }

        // 时间范围筛选
        if (StringUtils.hasText(startTime)) {
            wrapper.ge(Article::getCreateTime, startTime + " 00:00:00");
        }
        if (StringUtils.hasText(endTime)) {
            wrapper.le(Article::getCreateTime, endTime + " 23:59:59");
        }

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);

        List<ArticleVO> voList = batchConvertToVO(articlePage.getRecords());

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

        // 访客角色隐藏密码字段
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            User user = (User) auth.getPrincipal();
            if (user.getRole() == User.UserRole.VISITOR) {
                vo.setPassword(null);
            }
        }

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createArticle(ArticleDTO articleDTO) {
        Article article = new Article();
        BeanUtils.copyProperties(articleDTO, article);

        // 确保文章类型为POST
        article.setType(articleDTO.getType() != null ? articleDTO.getType() : Article.ArticleType.POST);

        // Boolean 转 Integer
        article.setIsTop(articleDTO.getIsTop() != null && articleDTO.getIsTop() ? 1 : 0);
        article.setIsRecommend(articleDTO.getIsRecommend() != null && articleDTO.getIsRecommend() ? 1 : 0);
        article.setAllowComment(articleDTO.getAllowComment() == null || articleDTO.getAllowComment() ? 1 : 0);

        // 获取当前用户ID（直接从认证信息中获取User对象）
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || !(auth.getPrincipal() instanceof User)) {
            throw new BusinessException("未获取到当前登录用户信息");
        }
        User user = (User) auth.getPrincipal();
        article.setAuthorId(user.getId());
        if (articleDTO.getStatus() == null) {
            articleDTO.setStatus(1);
        }
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

        // 设置来源（默认为系统创建）
        if (articleDTO.getSource() != null) {
            article.setSource(articleDTO.getSource());
        } else {
            article.setSource(0);
        }

        // 设置默认封面图（如果为空则随机选择）
        if (!StringUtils.hasText(article.getCoverImage())) {
            article.setCoverImage(getRandomThumb());
        }

        // 设置默认分类（如果为空则获取第一个分类）
        if (article.getCategoryId() == null) {
            Category firstCategory = categoryMapper.selectOne(new LambdaQueryWrapper<Category>()
                    .eq(Category::getStatus, 1)
                    .orderByAsc(Category::getSortOrder)
                    .last("LIMIT 1"));
            if (firstCategory != null) {
                article.setCategoryId(firstCategory.getId());
            }
        }

        articleMapper.insert(article);
        log.info("创建文章成功: {}", article.getTitle());

        // 保存文章版本
        if (user != null) {
            saveArticleVersion(article, user.getId());
        }

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

        // 获取当前用户（直接从认证信息中获取）
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = null;
        if (auth != null && auth.getPrincipal() instanceof User) {
            user = (User) auth.getPrincipal();
        }

        // 保存旧版本
        if (user != null) {
            saveArticleVersion(article, user.getId());
        }

        // 保留系统字段（不应被前端覆盖）
        Integer originalSource = article.getSource();
        Integer originalViewCount = article.getViewCount();
        Integer originalLikeCount = article.getLikeCount();
        Integer originalCommentCount = article.getCommentCount();
        LocalDateTime originalCreateTime = article.getCreateTime();

        BeanUtils.copyProperties(articleDTO, article);

        // 恢复系统字段
        article.setSource(originalSource);
        article.setViewCount(originalViewCount);
        article.setLikeCount(originalLikeCount);
        article.setCommentCount(originalCommentCount);
        article.setCreateTime(originalCreateTime);

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
    public void incrementCommentCount(Long id) {
        Article article = articleMapper.selectById(id);
        if (article != null && article.getCommentCount() != null) {
            article.setCommentCount(article.getCommentCount() + 1);
            articleMapper.updateById(article);
        }
    }

    @Override
    public void decrementCommentCount(Long id) {
        Article article = articleMapper.selectById(id);
        if (article != null && article.getCommentCount() != null && article.getCommentCount() > 0) {
            article.setCommentCount(article.getCommentCount() - 1);
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
        wrapper.in(Article::getStatus, 1, 2)
                .eq(Article::getType, Article.ArticleType.POST); // 只查询普通文章

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Article::getTitle, keyword)
                    .or()
                    .like(Article::getSummary, keyword)
                    .or()
                    .like(Article::getContent, keyword));
        }

        wrapper.orderByDesc(Article::getPublishTime);

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);

        List<ArticleVO> voList = batchConvertToVO(articlePage.getRecords());

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
        wrapper.in(Article::getStatus, 1, 2)
                .eq(Article::getType, Article.ArticleType.POST) // 只查询普通文章
                .orderByDesc(Article::getPublishTime);

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);

        List<ArticleVO> voList = batchConvertToVO(articlePage.getRecords());

        return PageResult.of(new Page<ArticleVO>()
                .setRecords(voList)
                .setCurrent(articlePage.getCurrent())
                .setSize(articlePage.getSize())
                .setTotal(articlePage.getTotal())
                .setPages(articlePage.getPages()));
    }

    @Override
    public List<ArchiveVO> getArchiveList() {
        // 只查询需要的字段，避免查询content等大字段
        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .select(Article::getId, Article::getTitle, Article::getCategoryId, Article::getPublishTime)
                .in(Article::getStatus, 1, 2)
                .eq(Article::getType, Article.ArticleType.POST)
                .orderByDesc(Article::getPublishTime));

        if (CollectionUtils.isEmpty(articles)) {
            return new ArrayList<>();
        }

        // 批量查询分类
        List<Long> categoryIds = articles.stream()
                .map(Article::getCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, String> categoryNameMap = categoryIds.isEmpty() ? new HashMap<>() :
                categoryMapper.selectBatchIds(categoryIds).stream()
                        .collect(Collectors.toMap(Category::getId, Category::getCategoryName));

        // 转换为VO
        return articles.stream().map(article -> {
            ArchiveVO vo = new ArchiveVO();
            vo.setId(article.getId());
            vo.setTitle(article.getTitle());
            vo.setPublishTime(article.getPublishTime());
            if (article.getCategoryId() != null) {
                vo.setCategoryName(categoryNameMap.get(article.getCategoryId()));
            }
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<ArticleVO> getRandomArticles(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 5;
        }

        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .in(Article::getStatus, 1, 2)
                .eq(Article::getType, Article.ArticleType.POST) // 只查询普通文章
                .last("ORDER BY RAND() LIMIT " + limit));

        return batchConvertToVO(articles);
    }

    @Override
    public List<ArticleVO> getRecommendArticles(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 5;
        }

        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .in(Article::getStatus, 1, 2)
                .eq(Article::getType, Article.ArticleType.POST) // 只查询普通文章
                .eq(Article::getIsRecommend, 1)
                .orderByDesc(Article::getPublishTime)
                .last("LIMIT " + limit));

        return batchConvertToVO(articles);
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

        // 过滤并批量转换
        List<Article> validArticles = articles.stream()
                .filter(a -> (a.getStatus() == 1 || a.getStatus() == 2) && a.getType() == Article.ArticleType.POST)
                .collect(Collectors.toList());

        return batchConvertToVO(validArticles);
    }

    @Override
    public List<LatestArticleDTO> getRecentArticles(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 5;
        }

        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .select(Article::getId, Article::getTitle, Article::getPublishTime)
                .in(Article::getStatus, 1, 2)
                .eq(Article::getType, Article.ArticleType.POST)
                .orderByDesc(Article::getPublishTime)
                .last("LIMIT " + limit));

        return articles.stream().map(article -> {
            LatestArticleDTO dto = new LatestArticleDTO();
            dto.setId(article.getId());
            dto.setTitle(article.getTitle());
            dto.setPublishTime(article.getPublishTime());
            return dto;
        }).collect(Collectors.toList());
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

        // 获取当前用户ID（直接从认证信息中获取User对象）
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || !(auth.getPrincipal() instanceof User)) {
            throw new BusinessException("未获取到当前登录用户信息");
        }
        User user = (User) auth.getPrincipal();
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

        // 获取当前用户（直接从认证信息中获取）
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = null;
        if (auth != null && auth.getPrincipal() instanceof User) {
            user = (User) auth.getPrincipal();
        }

        // 保存当前版本
        if (user != null) {
            saveArticleVersion(article, user.getId());
        }

        // 恢复历史版本
        article.setTitle(version.getTitle());
        article.setContent(version.getContent());
        article.setSummary(version.getSummary());
        // contentHtml 由前端渲染

        articleMapper.updateById(article);
        log.info("恢复文章版本成功: articleId={}, versionId={}", articleId, versionId);
    }

    @Override
    public void updateTopStatus(Long id, Integer isTop) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        article.setIsTop(isTop);
        articleMapper.updateById(article);
        log.info("更新文章置顶状态: id={}, isTop={}", id, isTop);
    }

    @Override
    public void updateRecommendStatus(Long id, Integer isRecommend) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        article.setIsRecommend(isRecommend);
        articleMapper.updateById(article);
        log.info("更新文章推荐状态: id={}, isRecommend={}", id, isRecommend);
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
     * 批量转换为VO（轻量级，用于列表页，不查询标签和内容）
     */
    private List<ArticleVO> batchConvertToListVO(List<Article> articles) {
        if (CollectionUtils.isEmpty(articles)) {
            return new ArrayList<>();
        }

        // 收集分类和作者ID
        List<Long> categoryIds = articles.stream()
                .map(Article::getCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        List<Long> authorIds = articles.stream()
                .map(Article::getAuthorId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        // 批量查询分类
        Map<Long, Category> categoryMap = categoryIds.isEmpty() ? new HashMap<>() :
                categoryMapper.selectBatchIds(categoryIds).stream()
                        .collect(Collectors.toMap(Category::getId, Function.identity()));

        // 批量查询用户
        Map<Long, User> userMap = authorIds.isEmpty() ? new HashMap<>() :
                userMapper.selectBatchIds(authorIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        // 转换为VO
        return articles.stream().map(article -> {
            ArticleVO vo = new ArticleVO();
            vo.setId(article.getId());
            vo.setTitle(article.getTitle());
            vo.setSlug(article.getSlug());
            vo.setCoverImage(article.getCoverImage());
            vo.setCategoryId(article.getCategoryId());
            vo.setAuthorId(article.getAuthorId());
            vo.setViewCount(article.getViewCount());
            vo.setLikeCount(article.getLikeCount());
            vo.setCommentCount(article.getCommentCount());
            vo.setIsTop(article.getIsTop());
            vo.setIsRecommend(article.getIsRecommend());
            vo.setAllowComment(article.getAllowComment());
            vo.setStatus(article.getStatus());
            vo.setPublishTime(article.getPublishTime());
            vo.setCreateTime(article.getCreateTime());
            vo.setType(article.getType());
            vo.setSortOrder(article.getSortOrder());

            // 处理封面图：如果为空，从content中提取第一张图片
            if (!StringUtils.hasText(vo.getCoverImage()) && StringUtils.hasText(article.getContent())) {
                String firstImage = extractFirstImage(article.getContent());
                if (firstImage != null) {
                    vo.setCoverImage(firstImage);
                }
            }

            // 处理摘要：如果没有摘要，从内容生成
            if (StringUtils.hasText(article.getSummary())) {
                vo.setSummary(article.getSummary());
            } else if (StringUtils.hasText(article.getContent())) {
                String plainText = stripMarkdown(article.getContent());
                vo.setSummary(plainText.length() > 150 ? plainText.substring(0, 150) + "..." : plainText);
            }

            // 从Map获取分类
            if (article.getCategoryId() != null) {
                Category category = categoryMap.get(article.getCategoryId());
                if (category != null) {
                    vo.setCategoryName(category.getCategoryName());
                }
            }

            // 从Map获取作者
            if (article.getAuthorId() != null) {
                User author = userMap.get(article.getAuthorId());
                if (author != null) {
                    vo.setAuthorName(author.getNickname());
                    vo.setAuthorEmail(author.getEmail());
                }
            }

            // 不设置content和tags
            vo.setHasPassword(StringUtils.hasText(article.getPassword()));

            return vo;
        }).collect(Collectors.toList());
    }

    /**
     * 去除Markdown格式，返回纯文本
     */
    private String stripMarkdown(String text) {
        if (text == null) return "";
        return text
            // Remove code blocks (```)
            .replaceAll("```[\\s\\S]*?```", "")
            // Remove inline code (`)
            .replaceAll("`[^`]*`", "")
            // Remove images ![alt](url)
            .replaceAll("!\\[.*?\\]\\(.*?\\)", "")
            // Remove links [text](url) -> text
            .replaceAll("\\[([^\\]]+)\\]\\([^)]+\\)", "$1")
            // Remove headers (# ## ### etc.)
            .replaceAll("^#{1,6}\\s+", "")
            // Remove bold (**text** or __text__)
            .replaceAll("\\*\\*([^*]+)\\*\\*", "$1")
            .replaceAll("__([^_]+)__", "$1")
            // Remove italic (*text* or _text_)
            .replaceAll("\\*([^*]+)\\*", "$1")
            .replaceAll("_([^_]+)_", "$1")
            // Remove strikethrough (~~text~~)
            .replaceAll("~~([^~]+)~~", "$1")
            // Remove blockquotes (> text)
            .replaceAll("^>\\s+", "")
            // Remove list markers (- * + or 1.)
            .replaceAll("^[\\s]*[-*+]\\s+", "")
            .replaceAll("^[\\s]*\\d+\\.\\s+", "")
            // Remove horizontal rules (--- or ***)
            .replaceAll("^[-*]{3,}$", "")
            // Remove HTML tags
            .replaceAll("<[^>]+>", "")
            // Remove extra whitespace and newlines
            .replaceAll("\\s+", " ")
            .trim();
    }

    /**
     * 批量转换为VO（优化N+1查询）
     */
    private List<ArticleVO> batchConvertToVO(List<Article> articles) {
        if (CollectionUtils.isEmpty(articles)) {
            return new ArrayList<>();
        }

        // 收集所有需要查询的ID
        List<Long> articleIds = articles.stream().map(Article::getId).collect(Collectors.toList());
        List<Long> categoryIds = articles.stream()
                .map(Article::getCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        List<Long> authorIds = articles.stream()
                .map(Article::getAuthorId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        // 批量查询分类
        Map<Long, Category> categoryMap = categoryIds.isEmpty() ? new HashMap<>() :
                categoryMapper.selectBatchIds(categoryIds).stream()
                        .collect(Collectors.toMap(Category::getId, Function.identity()));

        // 批量查询用户
        Map<Long, User> userMap = authorIds.isEmpty() ? new HashMap<>() :
                userMapper.selectBatchIds(authorIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        // 批量查询标签
        Map<Long, List<TagVO>> articleTagMap = new HashMap<>();
        if (!articleIds.isEmpty()) {
            List<ArticleTag> allArticleTags = articleTagMapper.selectList(
                    new LambdaQueryWrapper<ArticleTag>().in(ArticleTag::getArticleId, articleIds));

            if (!CollectionUtils.isEmpty(allArticleTags)) {
                List<Long> tagIds = allArticleTags.stream()
                        .map(ArticleTag::getTagId)
                        .distinct()
                        .collect(Collectors.toList());

                Map<Long, Tag> tagMap = tagIds.isEmpty() ? new HashMap<>() :
                        tagMapper.selectBatchIds(tagIds).stream()
                                .collect(Collectors.toMap(Tag::getId, Function.identity()));

                for (ArticleTag at : allArticleTags) {
                    Tag tag = tagMap.get(at.getTagId());
                    if (tag != null) {
                        TagVO tagVO = new TagVO();
                        BeanUtils.copyProperties(tag, tagVO);
                        articleTagMap.computeIfAbsent(at.getArticleId(), k -> new ArrayList<>()).add(tagVO);
                    }
                }
            }
        }

        // 转换为VO
        return articles.stream()
                .map(article -> convertToVOWithCache(article, categoryMap, userMap, articleTagMap))
                .collect(Collectors.toList());
    }

    /**
     * 使用缓存的Map转换为VO
     */
    private ArticleVO convertToVOWithCache(Article article,
                                          Map<Long, Category> categoryMap,
                                          Map<Long, User> userMap,
                                          Map<Long, List<TagVO>> articleTagMap) {
        ArticleVO vo = new ArticleVO();
        BeanUtils.copyProperties(article, vo);

        // 处理封面图：如果为空，从content中提取第一张图片
        if (!StringUtils.hasText(vo.getCoverImage()) && StringUtils.hasText(article.getContent())) {
            String firstImage = extractFirstImage(article.getContent());
            if (firstImage != null) {
                vo.setCoverImage(firstImage);
            }
        }

        // 从Map获取分类
        if (article.getCategoryId() != null) {
            Category category = categoryMap.get(article.getCategoryId());
            if (category != null) {
                vo.setCategoryName(category.getCategoryName());
            }
        }

        // 从Map获取作者
        if (article.getAuthorId() != null) {
            User author = userMap.get(article.getAuthorId());
            if (author != null) {
                vo.setAuthorName(author.getNickname());
            }
        }

        // 从Map获取标签
        vo.setTags(articleTagMap.getOrDefault(article.getId(), new ArrayList<>()));

        // 是否有密码
        vo.setHasPassword(StringUtils.hasText(article.getPassword()));

        return vo;
    }

    /**
     * 转换为VO（单条查询，用于详情等场景）
     */
    private ArticleVO convertToVO(Article article) {
        ArticleVO vo = new ArticleVO();
        BeanUtils.copyProperties(article, vo);

        // 处理封面图：如果为空，从content中提取第一张图片
        if (!StringUtils.hasText(vo.getCoverImage()) && StringUtils.hasText(article.getContent())) {
            String firstImage = extractFirstImage(article.getContent());
            if (firstImage != null) {
                vo.setCoverImage(firstImage);
            }
        }

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

    /**
     * 从Markdown内容中提取第一张图片URL
     */
    private String extractFirstImage(String content) {
        if (content == null || content.isEmpty()) {
            return null;
        }

        // 匹配Markdown图片语法: ![alt](url)
        java.util.regex.Pattern mdPattern = java.util.regex.Pattern.compile("!\\[.*?\\]\\(([^)]+)\\)");
        java.util.regex.Matcher mdMatcher = mdPattern.matcher(content);
        if (mdMatcher.find()) {
            return mdMatcher.group(1);
        }

        // 匹配HTML img标签: <img src="url" 或 <img src='url'
        java.util.regex.Pattern htmlPattern = java.util.regex.Pattern.compile("<img[^>]+src=[\"']([^\"']+)[\"']");
        java.util.regex.Matcher htmlMatcher = htmlPattern.matcher(content);
        if (htmlMatcher.find()) {
            return htmlMatcher.group(1);
        }

        return null;
    }

    // ========== 独立页面相关 ==========

    @Override
    public List<PageDTO> getPageList() {
        List<Article> pages = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .select(Article::getId, Article::getTitle, Article::getSlug,
                        Article::getStatus, Article::getTemplate, Article::getSortOrder)
                .eq(Article::getType, Article.ArticleType.PAGE)
                .orderByAsc(Article::getSortOrder)
                .orderByDesc(Article::getCreateTime));

        return pages.stream().map(page -> {
            PageDTO dto = new PageDTO();
            dto.setId(page.getId());
            dto.setTitle(page.getTitle());
            dto.setSlug(page.getSlug());
            dto.setStatus(page.getStatus());
            dto.setTemplate(page.getTemplate());
            dto.setSortOrder(page.getSortOrder());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public ArticleDetailVO getPageBySlug(String slug) {
        Article article = articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                .eq(Article::getSlug, slug)
                .eq(Article::getType, Article.ArticleType.PAGE)
                .eq(Article::getStatus, 1));
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        ArticleDetailVO detailVO = new ArticleDetailVO();
        BeanUtils.copyProperties(convertToVO(article), detailVO);
        detailVO.setContent(article.getContent());
        detailVO.setContentHtml(article.getContentHtml());
        return detailVO;
    }

    @Override
    public PageResult<ArticleVO> getPageListAdmin(Long current, Long size, String keyword) {
        Page<Article> page = new Page<>(current, size);

        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getType, Article.ArticleType.PAGE)
                .orderByAsc(Article::getSortOrder)
                .orderByDesc(Article::getCreateTime);

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Article::getTitle, keyword)
                    .or()
                    .like(Article::getSlug, keyword));
        }

        Page<Article> articlePage = articleMapper.selectPage(page, wrapper);

        List<ArticleVO> voList = batchConvertToVO(articlePage.getRecords());

        return PageResult.of(new Page<ArticleVO>()
                .setRecords(voList)
                .setCurrent(articlePage.getCurrent())
                .setSize(articlePage.getSize())
                .setTotal(articlePage.getTotal())
                .setPages(articlePage.getPages()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createPage(ArticleDTO articleDTO) {
        // 检查slug是否重复
        if (StringUtils.hasText(articleDTO.getSlug())) {
            Article existPage = articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                    .eq(Article::getSlug, articleDTO.getSlug()));
            if (existPage != null) {
                throw new BusinessException("别名已存在，请使用其他别名");
            }
        } else {
            throw new BusinessException("独立页面别名不能为空");
        }

        Article article = new Article();
        BeanUtils.copyProperties(articleDTO, article);
        article.setType(Article.ArticleType.PAGE);
        article.setIsTop(0);
        article.setIsRecommend(0);
        article.setAllowComment(articleDTO.getAllowComment() == null || articleDTO.getAllowComment() ? 1 : 0);

        // 获取当前用户ID（直接从认证信息中获取User对象）
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || !(auth.getPrincipal() instanceof User)) {
            throw new BusinessException("未获取到当前登录用户信息");
        }
        User user = (User) auth.getPrincipal();
        article.setAuthorId(user.getId());

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
        article.setSortOrder(articleDTO.getSortOrder() != null ? articleDTO.getSortOrder() : 0);

        articleMapper.insert(article);
        log.info("创建独立页面成功: {}", article.getTitle());

        return article.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePage(ArticleDTO articleDTO) {
        Article article = articleMapper.selectById(articleDTO.getId());
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }

        // 检查slug是否重复
        if (StringUtils.hasText(articleDTO.getSlug())) {
            Article existPage = articleMapper.selectOne(new LambdaQueryWrapper<Article>()
                    .eq(Article::getSlug, articleDTO.getSlug())
                    .ne(Article::getId, articleDTO.getId()));
            if (existPage != null) {
                throw new BusinessException("别名已存在，请使用其他别名");
            }
        } else {
            throw new BusinessException("独立页面别名不能为空");
        }

        String oldSlug = article.getSlug();
        BeanUtils.copyProperties(articleDTO, article);
        article.setType(Article.ArticleType.PAGE);
        article.setAllowComment(articleDTO.getAllowComment() == null || articleDTO.getAllowComment() ? 1 : 0);

        if (articleDTO.getPublishTime() != null) {
            article.setPublishTime(articleDTO.getPublishTime());
        } else if (article.getStatus() != 1 && articleDTO.getStatus() == 1) {
            article.setPublishTime(LocalDateTime.now());
        }

        article.setSortOrder(articleDTO.getSortOrder() != null ? articleDTO.getSortOrder() : 0);
        articleMapper.updateById(article);
        log.info("更新独立页面成功: {}", article.getTitle());
    }

    @Override
    public void updatePageStatus(Long id, Integer status) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        article.setStatus(status);
        articleMapper.updateById(article);
        log.info("更新独立页面状态: id={}, status={}", id, status);
    }

    @Override
    public void updatePageAllowComment(Long id, Integer allowComment) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        article.setAllowComment(allowComment);
        articleMapper.updateById(article);
        log.info("更新独立页面允许评论: id={}, allowComment={}", id, allowComment);
    }

    /**
     * 获取随机封面图路径
     */
    private String getRandomThumb() {
        int random = (int) (Math.random() * 9) + 1;
        return "/thumbs/" + random + ".jpg";
    }
}
