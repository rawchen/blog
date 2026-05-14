package com.rawchen.blog.vo;

import com.rawchen.blog.entity.Article;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章编辑VO
 *
 * @author RawChen
 */
@Data
public class ArticleEditVO implements Serializable {

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
     * 文章别名
     */
    private String slug;

    /**
     * 摘要
     */
    private String summary;

    /**
     * 内容(Markdown)
     */
    private String content;

    /**
     * HTML内容
     */
    private String contentHtml;

    /**
     * 封面图片
     */
    private String coverImage;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 标签ID列表
     */
    private List<Long> tagIds;

    /**
     * 作者ID
     */
    private Long authorId;

    /**
     * 浏览次数
     */
    private Integer viewCount;

    /**
     * 点赞数
     */
    private Integer likeCount;

    /**
     * 评论数
     */
    private Integer commentCount;

    /**
     * 是否置顶 0-否 1-是
     */
    private Integer isTop;

    /**
     * 是否推荐 0-否 1-是
     */
    private Integer isRecommend;

    /**
     * 状态 0-草稿 1-发布 2-回收站
     */
    private Integer status;

    /**
     * 访问密码
     */
    private String password;

    /**
     * 是否允许评论 0-否 1-是
     */
    private Integer allowComment;

    /**
     * 发布时间
     */
    private LocalDateTime publishTime;

    /**
     * 文章类型: POST-文章, PAGE-独立页面
     */
    private Article.ArticleType type;

    /**
     * 模板名称（独立页面专用）
     */
    private String template;

    /**
     * 排序顺序
     */
    private Integer sortOrder;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}
