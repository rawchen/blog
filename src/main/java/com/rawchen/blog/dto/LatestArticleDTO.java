package com.rawchen.blog.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 最新文章DTO（仅返回列表展示所需字段）
 *
 * @author RawChen
 */
@Data
public class LatestArticleDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String title;

    private LocalDateTime publishTime;
}
