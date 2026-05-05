package com.rawchen.blog.vo;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * 文章详情VO
 *
 * @author RawChen
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ArticleDetailVO extends ArticleVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 内容(Markdown)
     */
    private String content;

    /**
     * HTML内容
     */
    private String contentHtml;

    /**
     * 上一篇
     */
    private ArticleVO prevArticle;

    /**
     * 下一篇
     */
    private ArticleVO nextArticle;
}
