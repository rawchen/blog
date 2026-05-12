package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 评论实体
 *
 * @author RawChen
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("blog_comment")
public class Comment extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 文章ID
     */
    private Long articleId;

    /**
     * 父评论ID
     */
    private Long parentId;

    /**
     * 回复用户ID
     */
    private Long replyUserId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 昵称(游客)
     */
    private String nickname;

    /**
     * 邮箱(游客)
     */
    private String email;

    /**
     * 网站(游客)
     */
    private String website;

    /**
     * 头像
     */
    private String avatar;

    /**
     * 评论内容
     */
    private String content;

    /**
     * IP地址
     */
    private String ipAddress;

    /**
     * 用户代理
     */
    private String userAgent;

    /**
     * 点赞数
     */
    private Integer likeCount;

    /**
     * 状态 0-待审核 1-已发布 2-垃圾评论
     */
    private Integer status;
}