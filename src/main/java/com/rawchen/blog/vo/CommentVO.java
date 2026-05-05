package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 评论VO
 *
 * @author RawChen
 */
@Data
public class CommentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private Long articleId;

    private Long parentId;

    private Long replyUserId;

    private String replyUserName;

    private Long userId;

    private String nickname;

    private String email;

    private String website;

    private String avatar;

    private String content;

    private String ipAddress;

    private Integer likeCount;

    private Integer status;

    private LocalDateTime createTime;

    /**
     * 子评论列表
     */
    private List<CommentVO> children;
}
