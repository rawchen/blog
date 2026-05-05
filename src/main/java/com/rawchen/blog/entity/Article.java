package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 文章实体
 *
 * @author RawChen
 */
@Data
@TableName("blog_article")
public class Article implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 文章ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

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
     * 是否删除 0-否 1-是
     */
    @TableLogic
    private Integer isDeleted;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
