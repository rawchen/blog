package com.rawchen.blog.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章DTO
 *
 * @author RawChen
 */
@Data
public class ArticleDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 文章ID（更新时需要）
     */
    private Long id;

    /**
     * 标题
     */
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200个字符")
    private String title;

    /**
     * 摘要
     */
    @Size(max = 500, message = "摘要长度不能超过500个字符")
    private String summary;

    /**
     * 内容(Markdown)
     */
    @NotBlank(message = "内容不能为空")
    private String content;

    /**
     * 封面图片
     */
    private String coverImage;

    /**
     * 分类ID
     */
    @NotNull(message = "分类不能为空")
    private Long categoryId;

    /**
     * 标签ID列表
     */
    private List<Long> tagIds;

    /**
     * 新标签名称列表（输入文本创建的新标签）
     */
    private List<String> newTags;

    /**
     * 是否置顶
     */
    private Boolean isTop = false;

    /**
     * 是否推荐
     */
    private Boolean isRecommend = false;

    /**
     * 状态 0-草稿 1-发布
     */
    @NotNull(message = "状态不能为空")
    private Integer status;

    /**
     * 访问密码
     */
    private String password;

    /**
     * 是否允许评论
     */
    private Boolean allowComment = true;

    /**
     * 发布时间
     */
    private LocalDateTime publishTime;
}
