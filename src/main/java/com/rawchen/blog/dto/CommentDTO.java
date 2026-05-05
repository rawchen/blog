package com.rawchen.blog.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.io.Serializable;

/**
 * 评论DTO
 *
 * @author RawChen
 */
@Data
public class CommentDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 文章ID
     */
    @NotNull(message = "文章ID不能为空")
    private Long articleId;

    /**
     * 父评论ID
     */
    private Long parentId;

    /**
     * 回复用户ID
     */
    private Long replyUserId;

    /**
     * 昵称（游客必填）
     */
    @Size(max = 50, message = "昵称长度不能超过50个字符")
    private String nickname;

    /**
     * 邮箱（游客必填）
     */
    @Size(max = 100, message = "邮箱长度不能超过100个字符")
    private String email;

    /**
     * 网站
     */
    @Size(max = 255, message = "网站长度不能超过255个字符")
    private String website;

    /**
     * 评论内容
     */
    @NotBlank(message = "评论内容不能为空")
    @Size(min = 1, max = 1000, message = "评论内容长度必须在1-1000个字符之间")
    private String content;
}
