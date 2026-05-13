package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.dto.*;
import com.rawchen.blog.entity.*;
import com.rawchen.blog.mapper.*;
import com.rawchen.blog.service.MigrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 数据迁移服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class MigrationServiceImpl implements MigrationService {

    @Autowired
    private ArticleMapper articleMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private TagMapper tagMapper;

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private ArticleTagMapper articleTagMapper;

    // 迁移进度缓存（单例）
    private volatile MigrationProgressDTO currentProgress = null;
    private final AtomicBoolean migrating = new AtomicBoolean(false);

    // 旧ID到新ID的映射
    private Map<Long, Long> oldToNewCategoryIdMap = new HashMap<>();
    private Map<Long, Long> oldToNewTagIdMap = new HashMap<>();
    private Map<Long, Long> oldToNewArticleIdMap = new HashMap<>();

    @Override
    public List<String> getDatabases(MigrationConnectDTO dto) {
        List<String> databases = new ArrayList<>();
        String url = buildJdbcUrlWithoutDatabase(dto.getHost(), dto.getPort());

        try (Connection conn = DriverManager.getConnection(url, dto.getUsername(), dto.getPassword())) {
            DatabaseMetaData metaData = conn.getMetaData();
            ResultSet rs = metaData.getCatalogs();
            while (rs.next()) {
                databases.add(rs.getString("TABLE_CAT"));
            }
        } catch (SQLException e) {
            log.error("获取数据库列表失败", e);
            throw new RuntimeException("获取数据库列表失败: " + e.getMessage());
        }

        return databases;
    }

    @Override
    public MigrationConnectResponseDTO testConnection(MigrationConnectDTO dto) {
        MigrationConnectResponseDTO response = new MigrationConnectResponseDTO();

        String url = buildJdbcUrl(dto.getHost(), dto.getPort(), dto.getDatabase());

        try (Connection conn = DriverManager.getConnection(url, dto.getUsername(), dto.getPassword())) {
            response.setConnected(true);
            response.setMessage("连接成功");

            // 查询待迁移数据量
            response.setPendingCategoryCount(countTable(conn, "typecho_metas", "type='category'"));
            response.setPendingTagCount(countTable(conn, "typecho_metas", "type='tag'"));
            response.setPendingArticleCount(countTable(conn, "typecho_contents", "type!='attachment'"));
            response.setPendingCommentCount(countTable(conn, "typecho_comments", null));

        } catch (SQLException e) {
            response.setConnected(false);
            response.setMessage("连接失败: " + e.getMessage());
            log.error("数据库连接失败", e);
        }

        return response;
    }

    @Override
    public MigrationStatsDTO getMigrationStats() {
        MigrationStatsDTO stats = new MigrationStatsDTO();

        // 统计source=1的数据
        stats.setArticleCount(Math.toIntExact(articleMapper.selectCount(
                new LambdaQueryWrapper<Article>().eq(Article::getSource, 1))));
        stats.setCommentCount(Math.toIntExact(commentMapper.selectCount(
                new LambdaQueryWrapper<Comment>().eq(Comment::getSource, 1))));
        stats.setTagCount(Math.toIntExact(tagMapper.selectCount(
                new LambdaQueryWrapper<Tag>().eq(Tag::getSource, 1))));
        stats.setCategoryCount(Math.toIntExact(categoryMapper.selectCount(
                new LambdaQueryWrapper<Category>().eq(Category::getSource, 1))));

        return stats;
    }

    @Override
    public void startMigration(MigrationConnectDTO dto, Long currentUserId) {
        if (migrating.get()) {
            throw new RuntimeException("已有迁移任务正在进行中");
        }

        migrating.set(true);
        // 清空映射
        oldToNewCategoryIdMap.clear();
        oldToNewTagIdMap.clear();
        oldToNewArticleIdMap.clear();

        MigrationProgressDTO progress = new MigrationProgressDTO();
        progress.setMigrating(true);
        currentProgress = progress;

        // 异步执行迁移
        new Thread(() -> {
            Connection conn = null;
            try {
                String url = buildJdbcUrl(dto.getHost(), dto.getPort(), dto.getDatabase());
                conn = DriverManager.getConnection(url, dto.getUsername(), dto.getPassword());

                // 1. 迁移分类
                updateProgress(progress, "正在迁移分类数据...", 0, 0, 4);
                migrateCategories(conn, progress);

                // 2. 迁移标签
                updateProgress(progress, "正在迁移标签数据...", 0, 1, 4);
                migrateTags(conn, progress);

                // 3. 迁移文章
                updateProgress(progress, "正在迁移文章数据...", 0, 2, 4);
                migrateArticles(conn, progress, currentUserId);

                // 4. 迁移评论
                updateProgress(progress, "正在迁移评论数据...", 0, 3, 4);
                migrateComments(conn, progress);

                progress.setCompleted(true);
                progress.setMigrating(false);
                progress.setCurrentStep("迁移完成");
                progress.setProgress(100);

            } catch (Exception e) {
                log.error("迁移失败", e);
                progress.setErrorMessage("迁移失败: " + e.getMessage());
                progress.setMigrating(false);
            } finally {
                if (conn != null) {
                    try {
                        conn.close();
                    } catch (SQLException e) {
                        log.error("关闭连接失败", e);
                    }
                }
                migrating.set(false);
            }
        }).start();
    }

    @Override
    public MigrationProgressDTO getProgress() {
        if (currentProgress == null) {
            MigrationProgressDTO p = new MigrationProgressDTO();
            p.setMigrating(false);
            return p;
        }
        return currentProgress;
    }

    private void migrateCategories(Connection conn, MigrationProgressDTO progress) throws SQLException {
        String sql = "SELECT mid, name, slug, description, count FROM typecho_metas WHERE type='category'";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<long[]> dataList = new ArrayList<>();
            while (rs.next()) {
                long oldMid = rs.getLong("mid");
                String slug = rs.getString("slug");

                // 检查是否已存在（根据slug）
                Category existing = categoryMapper.selectOne(
                        new LambdaQueryWrapper<Category>().eq(Category::getCategorySlug, slug));

                if (existing != null) {
                    // 已存在，记录映射关系
                    oldToNewCategoryIdMap.put(oldMid, existing.getId());
                    log.info("分类已存在，跳过: {} -> {}", slug, existing.getId());
                    continue;
                }

                // 新增分类，不设置ID
                Category category = new Category();
                category.setCategoryName(rs.getString("name"));
                category.setCategorySlug(slug);
                category.setDescription(rs.getString("description"));
                category.setArticleCount(rs.getInt("count"));
                category.setSortOrder(0);
                category.setParentId(0L);
                category.setStatus(1);
                category.setSource(1);

                categoryMapper.insert(category);
                // 记录旧ID到新ID的映射
                oldToNewCategoryIdMap.put(oldMid, category.getId());
                log.info("新增分类: {} (旧mid={}, 新id={})", slug, oldMid, category.getId());

                dataList.add(new long[]{oldMid, category.getId()});
            }

            progress.setTotal(dataList.size());
            progress.setProcessed(dataList.size());
            progress.setProgress(100);
        }
    }

    private void migrateTags(Connection conn, MigrationProgressDTO progress) throws SQLException {
        String sql = "SELECT mid, name, slug, description, count FROM typecho_metas WHERE type='tag'";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<long[]> dataList = new ArrayList<>();
            while (rs.next()) {
                long oldMid = rs.getLong("mid");
                String slug = rs.getString("slug");

                // 检查是否已存在（根据slug）
                Tag existing = tagMapper.selectOne(
                        new LambdaQueryWrapper<Tag>().eq(Tag::getTagSlug, slug));

                if (existing != null) {
                    // 已存在，记录映射关系
                    oldToNewTagIdMap.put(oldMid, existing.getId());
                    log.info("标签已存在，跳过: {} -> {}", slug, existing.getId());
                    continue;
                }

                // 新增标签，不设置ID
                Tag tag = new Tag();
                tag.setTagName(rs.getString("name"));
                tag.setTagSlug(slug);
                tag.setDescription(rs.getString("description"));
                tag.setArticleCount(rs.getInt("count"));
                tag.setStatus(1);
                tag.setSource(1);

                tagMapper.insert(tag);
                // 记录旧ID到新ID的映射
                oldToNewTagIdMap.put(oldMid, tag.getId());
                log.info("新增标签: {} (旧mid={}, 新id={})", slug, oldMid, tag.getId());

                dataList.add(new long[]{oldMid, tag.getId()});
            }

            progress.setTotal(dataList.size());
            progress.setProcessed(dataList.size());
            progress.setProgress(100);
        }
    }

    private void migrateArticles(Connection conn, MigrationProgressDTO progress, Long currentUserId) throws SQLException {
        // 获取封面图映射（旧cid -> 封面图URL）
        Map<Long, String> thumbMap = buildThumbMap(conn);

        // 获取文章-分类/标签关联（旧cid -> 旧mid列表）
        Map<Long, Long> articleCategoryMap = new HashMap<>(); // 旧cid -> 旧分类mid
        Map<Long, List<Long>> articleTagMap = new HashMap<>(); // 旧cid -> 旧标签mid列表

        String relSql = "SELECT cid, mid FROM typecho_relationships";
        try (PreparedStatement ps = conn.prepareStatement(relSql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                long cid = rs.getLong("cid");
                long mid = rs.getLong("mid");

                // 判断是分类还是标签
                if (oldToNewCategoryIdMap.containsKey(mid)) {
                    articleCategoryMap.put(cid, mid);
                } else if (oldToNewTagIdMap.containsKey(mid)) {
                    articleTagMap.computeIfAbsent(cid, k -> new ArrayList<>()).add(mid);
                }
            }
        }

        // 迁移文章
        String sql = "SELECT cid, title, slug, created, modified, text, authorId, type, status, views, commentsNum, allowComment, password FROM typecho_contents WHERE type!='attachment'";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            List<Article> articles = new ArrayList<>();
            List<Long> oldCids = new ArrayList<>();
            while (rs.next()) {
                Article article = new Article();
                long oldCid = rs.getLong("cid");

                article.setTitle(rs.getString("title"));

                String slug = rs.getString("slug");
                String type = rs.getString("type");

                // 处理文章类型
                if ("page".equals(type)) {
                    // page类型时，slug转为大写作为type
                    try {
                        article.setType(Article.ArticleType.valueOf(slug.toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        article.setType(Article.ArticleType.POST);
                        article.setSlug(slug);
                    }
                } else {
                    article.setType(Article.ArticleType.POST);
                    article.setSlug(slug);
                }

                // 处理时间戳
                article.setCreateTime(timestampToLocalDateTime(rs.getLong("created")));
                article.setUpdateTime(timestampToLocalDateTime(rs.getLong("modified")));
                article.setPublishTime(timestampToLocalDateTime(rs.getLong("created")));

                // 处理内容
                String text = rs.getString("text");
                if (text != null && text.startsWith("<!--markdown-->")) {
                    text = text.substring(15);
                }
                article.setContent(text);

                // 作者ID - 统一使用当前用户
                article.setAuthorId(currentUserId);

                // 状态 - 统一设为已发布
                article.setStatus(1);

                // 浏览量
                article.setViewCount(rs.getInt("views"));
                article.setCommentCount(rs.getInt("commentsNum"));

                // 允许评论
                String allowComment = rs.getString("allowComment");
                article.setAllowComment("1".equals(allowComment) ? 1 : 0);

                // 密码
                article.setPassword(rs.getString("password"));

                // 分类 - 使用映射后的新分类ID
                if (articleCategoryMap.containsKey(oldCid)) {
                    Long oldMid = articleCategoryMap.get(oldCid);
                    Long newCategoryId = oldToNewCategoryIdMap.get(oldMid);
                    if (newCategoryId != null) {
                        article.setCategoryId(newCategoryId);
                    }
                }

                // 封面图
                if (thumbMap.containsKey(oldCid)) {
                    article.setCoverImage(thumbMap.get(oldCid));
                }

                article.setSource(1);
                article.setLikeCount(0);
                article.setIsTop(0);
                article.setIsRecommend(0);

                articles.add(article);
                oldCids.add(oldCid);
            }

            progress.setTotal(articles.size());
            for (int i = 0; i < articles.size(); i++) {
                Article article = articles.get(i);
                Long oldCid = oldCids.get(i);

                // 插入文章，不设置ID，让数据库自动生成
                articleMapper.insert(article);

                // 记录旧cid到新id的映射
                oldToNewArticleIdMap.put(oldCid, article.getId());
                log.info("新增文章: {} (旧cid={}, 新id={})", article.getTitle(), oldCid, article.getId());

                // 处理文章标签关联 - 使用映射后的新标签ID
                if (articleTagMap.containsKey(oldCid)) {
                    Long newArticleId = article.getId();
                    for (Long oldTagMid : articleTagMap.get(oldCid)) {
                        Long newTagId = oldToNewTagIdMap.get(oldTagMid);
                        if (newTagId != null) {
                            ArticleTag articleTag = new ArticleTag();
                            articleTag.setArticleId(newArticleId);
                            articleTag.setTagId(newTagId);
                            articleTagMapper.insert(articleTag);
                        }
                    }
                }

                progress.setProcessed(i + 1);
                progress.setProgress((i + 1) * 100 / articles.size());
            }
        }
    }

    private void migrateComments(Connection conn, MigrationProgressDTO progress) throws SQLException {
        String sql = "SELECT coid, cid, created, author, authorId, mail, url, ip, agent, text, parent FROM typecho_comments ORDER BY coid ASC";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            // 旧评论ID到新评论ID的映射（用于处理parent）
            Map<Long, Long> oldToNewCommentIdMap = new HashMap<>();

            List<Comment> comments = new ArrayList<>();
            List<Long> oldCoids = new ArrayList<>();
            List<Long> oldParentIds = new ArrayList<>();

            while (rs.next()) {
                long oldCid = rs.getLong("cid");
                Long newArticleId = oldToNewArticleIdMap.get(oldCid);

                if (newArticleId == null) {
                    log.info("评论关联的文章不存在，跳过: coid={}, cid={}", rs.getLong("coid"), oldCid);
                    continue;
                }

                Comment comment = new Comment();
                long oldCoid = rs.getLong("coid");

                comment.setArticleId(newArticleId);
                comment.setCreateTime(timestampToLocalDateTime(rs.getLong("created")));
                comment.setUpdateTime(timestampToLocalDateTime(rs.getLong("created")));
                comment.setNickname(rs.getString("author"));
                comment.setEmail(rs.getString("mail"));
                comment.setWebsite(rs.getString("url"));
                comment.setIpAddress(rs.getString("ip"));
                comment.setUserAgent(rs.getString("agent"));
                comment.setContent(rs.getString("text"));
                comment.setStatus(1); // 统一设为已发布
                comment.setSource(1);
                comment.setLikeCount(0);

                // authorId处理
                long authorId = rs.getLong("authorId");
                if (authorId != 0) {
                    comment.setUserId(authorId);
                }

                comments.add(comment);
                oldCoids.add(oldCoid);
                oldParentIds.add(rs.getLong("parent"));
            }

            progress.setTotal(comments.size());

            // 第一遍：插入所有评论，parent暂时设为0
            for (int i = 0; i < comments.size(); i++) {
                Comment comment = comments.get(i);
                comment.setParentId(0L); // 先设为0

                commentMapper.insert(comment);

                Long oldCoid = oldCoids.get(i);
                oldToNewCommentIdMap.put(oldCoid, comment.getId());
                log.info("新增评论: {} (旧coid={}, 新id={})", comment.getNickname(), oldCoid, comment.getId());
            }

            // 第二遍：更新parent关系
            for (int i = 0; i < comments.size(); i++) {
                Comment comment = comments.get(i);
                Long oldParentId = oldParentIds.get(i);

                if (oldParentId != null && oldParentId > 0) {
                    Long newParentId = oldToNewCommentIdMap.get(oldParentId);
                    if (newParentId != null) {
                        comment.setParentId(newParentId);
                        commentMapper.updateById(comment);
                    }
                }

                progress.setProcessed(i + 1);
                progress.setProgress((i + 1) * 100 / comments.size());
            }
        }
    }

    private Map<Long, String> buildThumbMap(Connection conn) throws SQLException {
        Map<Long, String> map = new HashMap<>();
        String sql = "SELECT cid, str_value FROM typecho_fields WHERE name='thumb' AND str_value IS NOT NULL AND str_value!=''";
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                map.put(rs.getLong("cid"), rs.getString("str_value"));
            }
        }
        return map;
    }

    private String buildJdbcUrl(String host, Integer port, String database) {
        return String.format("jdbc:mysql://%s:%d/%s?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true",
                host, port, database);
    }

    private String buildJdbcUrlWithoutDatabase(String host, Integer port) {
        return String.format("jdbc:mysql://%s:%d?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true",
                host, port);
    }

    private int countTable(Connection conn, String table, String where) throws SQLException {
        String sql = "SELECT COUNT(*) FROM " + table;
        if (where != null) {
            sql += " WHERE " + where;
        }
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return rs.getInt(1);
            }
        }
        return 0;
    }

    private LocalDateTime timestampToLocalDateTime(long timestamp) {
        if (timestamp == 0) {
            return LocalDateTime.now();
        }
        return LocalDateTime.ofInstant(
                new java.util.Date(timestamp * 1000).toInstant(),
                ZoneId.systemDefault()
        );
    }

    private void updateProgress(MigrationProgressDTO progress, String step, int processed, int currentPhase, int totalPhases) {
        progress.setCurrentStep(step);
        progress.setProcessed(processed);
        progress.setProgress(currentPhase * 100 / totalPhases);
    }
}
