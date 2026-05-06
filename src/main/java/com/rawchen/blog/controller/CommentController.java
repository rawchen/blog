package com.rawchen.blog.controller;

import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.CommentDTO;
import com.rawchen.blog.service.CommentService;
import com.rawchen.blog.vo.CommentVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * 评论控制器
 *
 * @author RawChen
 */
@Api(tags = "评论管理")
@RestController
@RequestMapping("/api/comment")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @ApiOperation("分页查询评论列表（前台）")
    @GetMapping("/list/{articleId}")
    public R<PageResult<CommentVO>> getCommentList(
            @PathVariable Long articleId,
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return R.ok(commentService.getCommentList(articleId, current, size));
    }

    @ApiOperation("获取最近评论")
    @GetMapping("/recent")
    public R<List<CommentVO>> getRecentComments(
            @RequestParam(defaultValue = "10") Integer limit) {
        return R.ok(commentService.getRecentComments(limit));
    }

    @ApiOperation("提交评论")
    @PostMapping("/submit")
    public R<Long> submitComment(@Valid @RequestBody CommentDTO commentDTO) {
        return R.ok(commentService.submitComment(commentDTO));
    }

    @ApiOperation("回复评论")
    @PostMapping("/reply")
    public R<Long> replyComment(@Valid @RequestBody CommentDTO commentDTO) {
        return R.ok(commentService.replyComment(commentDTO));
    }

    @ApiOperation("点赞评论")
    @PostMapping("/like/{id}")
    public R<Void> likeComment(@PathVariable Long id) {
        commentService.likeComment(id);
        return R.ok();
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("分页查询评论列表（后台）")
    @GetMapping("/admin/list")
    @PreAuthorize("hasAuthority('content:comment:query')")
    public R<PageResult<CommentVO>> getCommentListAdmin(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) Integer status) {
        return R.ok(commentService.getCommentListAdmin(current, size, status));
    }

    @ApiOperation("审核评论")
    @PutMapping("/admin/audit/{id}")
    @PreAuthorize("hasAuthority('content:comment:audit')")
    public R<Void> auditComment(@PathVariable Long id, @RequestParam Integer status) {
        commentService.auditComment(id, status);
        return R.ok();
    }

    @ApiOperation("批量审核评论")
    @PutMapping("/admin/batch-audit")
    @PreAuthorize("hasAuthority('content:comment:audit')")
    public R<Void> batchAuditComment(@RequestBody List<Long> ids, @RequestParam Integer status) {
        commentService.batchAuditComments(ids, status);
        return R.ok();
    }

    @ApiOperation("删除评论")
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:comment:delete')")
    public R<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return R.ok();
    }

    @ApiOperation("批量删除评论")
    @PostMapping("/admin/batch-delete")
    @PreAuthorize("hasAuthority('content:comment:delete')")
    public R<Void> batchDeleteComment(@RequestBody List<Long> ids) {
        commentService.batchDeleteComments(ids);
        return R.ok();
    }
}
