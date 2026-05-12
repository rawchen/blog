package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 文章版本历史实体
 *
 * @author RawChen
 */
@Data
@TableName("blog_article_version")
public class ArticleVersion implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 文章ID
     */
    private Long articleId;

    /**
     * 版本号
     */
    private Integer version;

    /**
     * 标题
     */
    private String title;

    /**
     * 内容(Markdown)
     */
    private String content;

    /**
     * 摘要
     */
    private String summary;

    /**
     * 操作者ID
     */
    private Long authorId;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}