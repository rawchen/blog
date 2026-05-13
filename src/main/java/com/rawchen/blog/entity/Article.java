package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 文章实体
 *
 * @author RawChen
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("blog_article")
public class Article extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 标题
     */
    private String title;

    /**
     * 文章别名
     */
    private String slug;

    /**
     * 摘要
     */
    private String summary;

    /**
     * 内容(Markdown)
     */
    private String content;

    /**
     * HTML内容
     */
    private String contentHtml;

    /**
     * 封面图片
     */
    private String coverImage;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 作者ID
     */
    private Long authorId;

    /**
     * 浏览次数
     */
    private Integer viewCount;

    /**
     * 点赞数
     */
    private Integer likeCount;

    /**
     * 评论数
     */
    private Integer commentCount;

    /**
     * 是否置顶 0-否 1-是
     */
    private Integer isTop;

    /**
     * 是否推荐 0-否 1-是
     */
    private Integer isRecommend;

    /**
     * 状态 0-草稿 1-发布 2-回收站
     */
    private Integer status;

    /**
     * 访问密码
     */
    private String password;

    /**
     * 是否允许评论 0-否 1-是
     */
    private Integer allowComment;

    /**
     * 发布时间
     */
    private LocalDateTime publishTime;

    /**
     * 文章类型: post-文章, about-关于, friend-友链, music-音乐, down-下载, search-搜索, archive-分类
     */
    @TableField("type")
    private ArticleType type = ArticleType.POST;

    /**
     * 来源: 0-系统, 1-迁移, 2-抓取
     */
    private Integer source;

    /**
     * 文章类型枚举
     */
    public enum ArticleType {
        POST,       // 文章
        ABOUT,      // 关于
        FRIEND,     // 友链
        MUSIC,      // 音乐
        DOWN,       // 下载
        SEARCH,     // 搜索
        ARCHIVE,    // 分类
        CROSS,    // 简笔
        MOVIE,    // 电影
        PHOTO,    // 咔嚓
        MOMENT    // 朋友圈
    }
}