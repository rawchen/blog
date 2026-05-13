package com.rawchen.blog.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 迁移连接响应DTO
 *
 * @author RawChen
 */
@Data
public class MigrationConnectResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 是否连接成功
     */
    private Boolean connected;

    /**
     * 连接消息
     */
    private String message;

    /**
     * 待同步文章数
     */
    private Integer pendingArticleCount;

    /**
     * 待同步评论数
     */
    private Integer pendingCommentCount;

    /**
     * 待同步标签数
     */
    private Integer pendingTagCount;

    /**
     * 待同步类目数
     */
    private Integer pendingCategoryCount;

    public MigrationConnectResponseDTO() {
        this.connected = false;
        this.pendingArticleCount = 0;
        this.pendingCommentCount = 0;
        this.pendingTagCount = 0;
        this.pendingCategoryCount = 0;
    }
}
