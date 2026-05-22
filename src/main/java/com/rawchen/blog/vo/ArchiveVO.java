package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 归档VO（轻量级，只包含归档页面需要的字段）
 *
 * @author RawChen
 */
@Data
public class ArchiveVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 文章ID
     */
    private Long id;

    /**
     * 标题
     */
    private String title;

    /**
     * 分类名称
     */
    private String categoryName;

    /**
     * 发布时间
     */
    private LocalDateTime publishTime;
}