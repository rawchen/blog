package com.rawchen.blog.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HtmlUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.dto.CommentDTO;
import com.rawchen.blog.entity.Comment;
import com.rawchen.blog.entity.User;
import com.rawchen.blog.mapper.CommentMapper;
import com.rawchen.blog.mapper.UserMapper;
import com.rawchen.blog.service.CommentService;
import com.rawchen.blog.service.ConfigService;
import com.rawchen.blog.vo.CommentVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 评论服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class CommentServiceImpl implements CommentService {

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ConfigService configService;

    @Autowired
    private HttpServletRequest request;

    /**
     * 获取客户端IP地址
     */
    private String getClientIp() {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多个代理时取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    @Override
    public PageResult<CommentVO> getCommentList(Long articleId, Long current, Long size) {
        // 查询顶级评论（分页）
        Page<Comment> page = new Page<>(current, size);

        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Comment::getArticleId, articleId)
                .eq(Comment::getStatus, 1)
                .eq(Comment::getParentId, 0)
                .orderByDesc(Comment::getCreateTime);

        Page<Comment> commentPage = commentMapper.selectPage(page, wrapper);

        // 一次性查出该文章所有已审核的非顶级评论
        List<Comment> allReplies = commentMapper.selectList(new LambdaQueryWrapper<Comment>()
                .eq(Comment::getArticleId, articleId)
                .eq(Comment::getStatus, 1)
                .ne(Comment::getParentId, 0)
                .orderByAsc(Comment::getCreateTime));

        // 构建id到VO的映射
        Map<Long, CommentVO> allVoMap = allReplies.stream()
                .map(this::convertToVO)
                .collect(Collectors.toMap(CommentVO::getId, v -> v));

        // 转换顶级评论并构建映射
        List<CommentVO> voList = commentPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        Map<Long, CommentVO> rootVoMap = voList.stream()
                .collect(Collectors.toMap(CommentVO::getId, v -> v));

        // 合并到总映射
        allVoMap.putAll(rootVoMap);

        // 构建树形结构：将每个评论添加到其父评论的children中
        for (CommentVO vo : allVoMap.values()) {
            if (vo.getParentId() != null && vo.getParentId() != 0) {
                CommentVO parent = allVoMap.get(vo.getParentId());
                if (parent != null) {
                    if (parent.getChildren() == null) {
                        parent.setChildren(new ArrayList<>());
                    }
                    parent.getChildren().add(vo);
                }
            }
        }

        return PageResult.of(new Page<CommentVO>()
                .setRecords(voList)
                .setCurrent(commentPage.getCurrent())
                .setSize(commentPage.getSize())
                .setTotal(commentPage.getTotal())
                .setPages(commentPage.getPages()));
    }

    @Override
    public PageResult<CommentVO> getCommentListAdmin(Long current, Long size, Integer status) {
        Page<Comment> page = new Page<>(current, size);

        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Comment::getStatus, status);
        }
        wrapper.orderByDesc(Comment::getCreateTime);

        Page<Comment> commentPage = commentMapper.selectPage(page, wrapper);

        List<CommentVO> voList = commentPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(new Page<CommentVO>()
                .setRecords(voList)
                .setCurrent(commentPage.getCurrent())
                .setSize(commentPage.getSize())
                .setTotal(commentPage.getTotal())
                .setPages(commentPage.getPages()));
    }

    @Override
    public Long submitComment(CommentDTO commentDTO) {
        Comment comment = new Comment();
        BeanUtils.copyProperties(commentDTO, comment);

        // 检查是否登录用户
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                    .eq(User::getUsername, auth.getName()));
            if (user != null) {
                comment.setUserId(user.getId());
                comment.setNickname(user.getNickname());
                comment.setEmail(user.getEmail());
                comment.setAvatar(user.getAvatar());
            }
        }

        // 过滤HTML标签
        comment.setContent(HtmlUtil.cleanHtmlTag(commentDTO.getContent()));

        // 设置IP地址和User-Agent
        comment.setIpAddress(getClientIp());
        comment.setUserAgent(request.getHeader("User-Agent"));

        // 根据配置决定是否需要审核
        String commentEnabled = configService.getConfigByKey("comment_enabled", "false");
        boolean needAudit = "true".equalsIgnoreCase(commentEnabled) || "1".equals(commentEnabled);
        comment.setStatus(needAudit ? 0 : 1);
        comment.setLikeCount(0);

        commentMapper.insert(comment);
        log.info("提交评论成功: {}", comment.getId());
        return comment.getId();
    }

    @Override
    public void auditComment(Long id, Integer status) {
        Comment comment = commentMapper.selectById(id);
        if (comment == null) {
            throw new RuntimeException("评论不存在");
        }
        comment.setStatus(status);
        commentMapper.updateById(comment);
        log.info("审核评论成功: {}, status: {}", id, status);
    }

    @Override
    public void deleteComment(Long id) {
        commentMapper.deleteById(id);
        log.info("删除评论成功: {}", id);
    }

    @Override
    public Long replyComment(CommentDTO commentDTO) {
        Comment comment = new Comment();
        BeanUtils.copyProperties(commentDTO, comment);

        // 设置父评论ID
        if (commentDTO.getParentId() == null) {
            throw new RuntimeException("父评论ID不能为空");
        }

        // 检查是否登录用户
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                    .eq(User::getUsername, auth.getName()));
            if (user != null) {
                comment.setUserId(user.getId());
                comment.setNickname(user.getNickname());
                comment.setEmail(user.getEmail());
                comment.setAvatar(user.getAvatar());
            }
        }

        // 过滤HTML标签
        comment.setContent(HtmlUtil.cleanHtmlTag(commentDTO.getContent()));

        // 设置IP地址和User-Agent
        comment.setIpAddress(getClientIp());
        comment.setUserAgent(request.getHeader("User-Agent"));

        // 根据配置决定是否需要审核
        String commentEnabled = configService.getConfigByKey("comment_enabled", "false");
        boolean needAudit = "true".equalsIgnoreCase(commentEnabled) || "1".equals(commentEnabled);
        comment.setStatus(needAudit ? 0 : 1);
        comment.setLikeCount(0);

        commentMapper.insert(comment);
        log.info("回复评论成功: {}", comment.getId());
        return comment.getId();
    }

    @Override
    public void likeComment(Long id) {
        Comment comment = commentMapper.selectById(id);
        if (comment != null) {
            comment.setLikeCount(comment.getLikeCount() + 1);
            commentMapper.updateById(comment);
        }
    }

    @Override
    public List<CommentVO> getRecentComments(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 10;
        }

        List<Comment> comments = commentMapper.selectList(new LambdaQueryWrapper<Comment>()
                .eq(Comment::getStatus, 1)
                .orderByDesc(Comment::getCreateTime)
                .last("LIMIT " + limit));

        return comments.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public void batchAuditComments(List<Long> ids, Integer status) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        for (Long id : ids) {
            Comment comment = commentMapper.selectById(id);
            if (comment != null) {
                comment.setStatus(status);
                commentMapper.updateById(comment);
            }
        }
        log.info("批量审核评论成功: {}, status: {}", ids, status);
    }

    @Override
    public void batchDeleteComments(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        commentMapper.deleteBatchIds(ids);
        log.info("批量删除评论成功: {}", ids);
    }

    private CommentVO convertToVO(Comment comment) {
        CommentVO vo = new CommentVO();
        BeanUtils.copyProperties(comment, vo);

        // 设置回复用户名
        if (comment.getReplyUserId() != null) {
            User replyUser = userMapper.selectById(comment.getReplyUserId());
            if (replyUser != null) {
                vo.setReplyUserName(replyUser.getNickname());
            }
        }

        return vo;
    }
}
