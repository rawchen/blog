package com.rawchen.blog.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.dto.CommentDTO;
import com.rawchen.blog.entity.Comment;
import com.rawchen.blog.vo.CommentVO;

import java.util.List;

/**
 * 评论服务接口
 *
 * @author RawChen
 */
public interface CommentService {

    /**
     * 分页查询评论列表（前台）
     */
    PageResult<CommentVO> getCommentList(Long articleId, Long current, Long size);

    /**
     * 分页查询评论列表（后台）
     */
    PageResult<CommentVO> getCommentListAdmin(Long current, Long size, Integer status);

    /**
     * 提交评论
     */
    Long submitComment(CommentDTO commentDTO);

    /**
     * 审核评论
     */
    void auditComment(Long id, Integer status);

    /**
     * 删除评论
     */
    void deleteComment(Long id);

    /**
     * 回复评论
     */
    Long replyComment(CommentDTO commentDTO);

    /**
     * 点赞评论
     */
    void likeComment(Long id);

    /**
     * 获取最近评论
     */
    List<CommentVO> getRecentComments(Integer limit);

    /**
     * 批量审核评论
     */
    void batchAuditComments(List<Long> ids, Integer status);

    /**
     * 批量删除评论
     */
    void batchDeleteComments(List<Long> ids);
}
