package com.rawchen.blog.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 独立页面DTO（仅返回导航所需字段）
 *
 * @author RawChen
 */
@Data
public class PageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String title;

    private String slug;

    private Integer status;

    private String template;

    private Integer sortOrder;
}