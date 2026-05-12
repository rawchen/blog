package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 友链实体
 *
 * @author RawChen
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("blog_friend_link")
public class FriendLink extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 网站名称
     */
    private String siteName;

    /**
     * 网站链接
     */
    private String siteUrl;

    /**
     * 网站Logo
     */
    @TableField("site_logo")
    private String logo;

    /**
     * 网站描述
     */
    private String description;

    /**
     * 站长名称
     */
    private String ownerName;

    /**
     * 站长邮箱
     */
    private String ownerEmail;

    /**
     * 状态 0-待审核 1-正常 2-失效
     */
    private Integer status;

    /**
     * 排序
     */
    private Integer sortOrder;
}