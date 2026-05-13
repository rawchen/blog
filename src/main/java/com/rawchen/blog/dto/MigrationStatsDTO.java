package com.rawchen.blog.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 迁移统计响应DTO
 *
 * @author RawChen
 */
@Data
public class MigrationStatsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 已同步文章数
     */
    private Integer articleCount;

    /**
     * 已同步评论数
     */
    private Integer commentCount;

    /**
     * 已同步标签数
     */
    private Integer tagCount;

    /**
     * 已同步类目数
     */
    private Integer categoryCount;

    public MigrationStatsDTO() {
        this.articleCount = 0;
        this.commentCount = 0;
        this.tagCount = 0;
        this.categoryCount = 0;
    }
}
