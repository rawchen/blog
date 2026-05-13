package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 标签实体
 *
 * @author RawChen
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("blog_tag")
public class Tag extends BaseEntity {

    private static final long serialVersionUID = 1L;

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
     * 状态 0-禁用 1-正常
     */
    private Integer status;

    /**
     * 来源: 0-系统, 1-迁移, 2-抓取
     */
    private Integer source;
}