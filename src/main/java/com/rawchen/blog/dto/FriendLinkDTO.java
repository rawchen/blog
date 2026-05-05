package com.rawchen.blog.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import java.io.Serializable;

/**
 * 友链DTO
 *
 * @author RawChen
 */
@Data
public class FriendLinkDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    private Long id;

    /**
     * 网站名称
     */
    @NotBlank(message = "网站名称不能为空")
    private String siteName;

    /**
     * 网站链接
     */
    @NotBlank(message = "网站链接不能为空")
    @Pattern(regexp = "^https?://.*", message = "网站链接格式不正确")
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
     * 站长邮箱
     */
    private String ownerEmail;

    /**
     * 状态
     */
    private Integer status;

    /**
     * 排序
     */
    private Integer sortOrder;
}