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
     * 文章类型: POST-文章, PAGE-独立页面
     */
    @TableField("type")
    private ArticleType type = ArticleType.POST;

    /**
     * 模板名称: 用于独立页面的特殊渲染模板
     * 如: search(搜索页), archive(分类页), friends(友链页), moments(朋友圈)
     * 为空则使用默认模板渲染markdown内容
     */
    private String template;

    /**
     * 排序顺序
     */
    private Integer sortOrder;

    /**
     * 来源: 0-系统, 1-迁移, 2-抓取
     */
    private Integer source;

    /**
     * 文章类型枚举
     */
    public enum ArticleType {
        POST,       // 文章
        PAGE        // 独立页面
    }
}
