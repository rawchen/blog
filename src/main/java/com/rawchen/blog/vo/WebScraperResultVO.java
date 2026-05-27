package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 网页采集结果VO
 *
 * @author RawChen
 */
@Data
public class WebScraperResultVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 文章标题
     */
    private String title;

    /**
     * 文章内容（Markdown格式）
     */
    private String content;

    /**
     * 摘要
     */
    private String summary;

    /**
     * 提取的标签列表
     */
    private List<String> tags;

    /**
     * 来源URL
     */
    private String sourceUrl;
}