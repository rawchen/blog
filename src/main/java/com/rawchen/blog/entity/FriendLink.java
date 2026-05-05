package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 友链实体
 *
 * @author RawChen
 */
@Data
@TableName("blog_friend_link")
public class FriendLink implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

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