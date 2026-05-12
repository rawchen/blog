package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 朋友圈实体
 *
 * @author RawChen
 */
@Data
@TableName("blog_moment")
public class Moment implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 标题
     */
    private String title;

    /**
     * 描述
     */
    private String description;

    /**
     * 链接
     */
    private String link;

    /**
     * 作者
     */
    private String author;

    /**
     * 站点名
     */
    private String siteName;

    /**
     * 图标
     */
    private String icon;

    /**
     * 图片
     */
    private String img;

    /**
     * 发布时间
     */
    private LocalDateTime publishTime;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}