package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 友链VO
 *
 * @author RawChen
 */
@Data
public class FriendLinkVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
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
     * 状态
     */
    private Integer status;

    /**
     * 排序
     */
    private Integer sortOrder;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}