package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 分类VO
 *
 * @author RawChen
 */
@Data
public class CategoryVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String categoryName;

    private String categorySlug;

    private String description;

    private Long parentId;

    private Integer sortOrder;

    private Integer articleCount;

    private String icon;

    private LocalDateTime createTime;
}
