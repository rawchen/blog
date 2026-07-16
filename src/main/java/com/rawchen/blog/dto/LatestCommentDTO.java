package com.rawchen.blog.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 最新评论DTO（仅返回列表展示所需字段）
 *
 * @author RawChen
 */
@Data
public class LatestCommentDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private Long articleId;

    /**
     * 文章slug（仅当文章类型为PAGE时设置，用于拼接独立页面路径）
     */
    private String articleSlug;

    private String content;

    private LocalDateTime createTime;

    private String nickname;
}
