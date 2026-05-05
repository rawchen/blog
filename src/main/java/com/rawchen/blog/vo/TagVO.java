package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 标签VO
 *
 * @author RawChen
 */
@Data
public class TagVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 标签ID
     */
    private Long id;

    /**
     * 标签名称
     */
    private String tagName;

    /**
     * 标签别名
     */
    private String tagSlug;

    /**
     * 描述
     */
    private String description;

    /**
     * 文章数量
     */
    private Integer articleCount;

    /**
     * 标签颜色
     */
    private String color;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}
