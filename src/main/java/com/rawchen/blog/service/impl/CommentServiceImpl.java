package com.rawchen.blog.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HtmlUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.dto.CommentDTO;
import com.rawchen.blog.entity.Article;
import com.rawchen.blog.entity.Comment;
import com.rawchen.blog.entity.User;
import com.rawchen.blog.mapper.ArticleMapper;
import com.rawchen.blog.mapper.CommentMapper;
import com.rawchen.blog.mapper.UserMapper;
import com.rawchen.blog.service.CommentService;
import com.rawchen.blog.service.ConfigService;
import com.rawchen.blog.service.MailService;
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
    private ArticleMapper articleMapper;

    @Autowired
    private MailService mailService;

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

        // 构建树形结构：将每个评论添加到其父评论的children中，并设置父评论昵称
        for (CommentVO vo : allVoMap.values()) {
            if (vo.getParentId() != null && vo.getParentId() != 0) {
                CommentVO parent = allVoMap.get(vo.getParentId());
                if (parent != null) {
                    // 设置父评论昵称用于显示@回复
                    vo.setParentNickname(parent.getNickname());
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
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
            User user = (User) auth.getPrincipal();
            comment.setUserId(user.getId());
            comment.setNickname(user.getNickname());
            comment.setEmail(user.getEmail());
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

        // 发送新评论通知邮件给文章作者
        try {
            String mailEnabled = configService.getConfigByKey("mail_enabled", "false");
            if ("true".equalsIgnoreCase(mailEnabled) || "1".equals(mailEnabled)) {
                Article article = articleMapper.selectById(comment.getArticleId());
                if (article != null) {
                    String blogUrl = configService.getConfigByKey("site_url", "");
                    String blogName = configService.getConfigByKey("site_name", "我的博客");
                    mailService.sendNewCommentMail(comment, article, blogUrl, blogName);
                }
            }
        } catch (Exception e) {
            log.error("发送新评论通知邮件失败", e);
        }

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
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
            User user = (User) auth.getPrincipal();
            comment.setUserId(user.getId());
            comment.setNickname(user.getNickname());
            comment.setEmail(user.getEmail());
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

        // 发送回复通知邮件给被回复者
        try {
            String mailEnabled = configService.getConfigByKey("mail_enabled", "false");
            if ("true".equalsIgnoreCase(mailEnabled) || "1".equals(mailEnabled)) {
                Comment parentComment = commentMapper.selectById(commentDTO.getParentId());
                Article article = articleMapper.selectById(comment.getArticleId());
                if (parentComment != null && article != null) {
                    String blogUrl = configService.getConfigByKey("site_url", "");
                    String blogName = configService.getConfigByKey("site_name", "我的博客");
                    mailService.sendReplyMail(comment, parentComment, article, blogUrl, blogName);
                }
            }
        } catch (Exception e) {
            log.error("发送回复通知邮件失败", e);
        }

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

    @Override
    public Integer getCommentPageNum(Long articleId, Long commentId, Long pageSize) {
        // 查找目标评论
        Comment targetComment = commentMapper.selectById(commentId);
        if (targetComment == null) {
            return 1;
        }

        // 如果评论不属于该文章，返回第一页
        if (!targetComment.getArticleId().equals(articleId)) {
            return 1;
        }

        // 找到根评论ID（如果是子评论，需要找到其顶级父评论）
        Long rootId = getRootCommentId(targetComment);

        // 计算该根评论在所有顶级评论中的位置（按createTime倒序）
        // 查询所有顶级评论的ID列表（按createTime倒序）
        List<Comment> rootComments = commentMapper.selectList(new LambdaQueryWrapper<Comment>()
                .eq(Comment::getArticleId, articleId)
                .eq(Comment::getStatus, 1)
                .eq(Comment::getParentId, 0)
                .orderByDesc(Comment::getCreateTime)
                .select(Comment::getId));

        // 找到根评论在列表中的位置（从0开始）
        int position = 0;
        for (int i = 0; i < rootComments.size(); i++) {
            if (rootComments.get(i).getId().equals(rootId)) {
                position = i;
                break;
            }
        }

        // 计算页码（position从0开始，页码从1开始）
        // 例如：position=0是第一条评论，在第1页；position=9是第10条评论，也在第1页（pageSize=10）
        int pageNum = (position / pageSize.intValue()) + 1;
        return pageNum;
    }

    /**
     * 获取评论的根评论ID
     */
    private Long getRootCommentId(Comment comment) {
        if (comment.getParentId() == null || comment.getParentId() == 0) {
            return comment.getId();
        }
        // 递归查找父评论直到找到顶级评论
        Comment parent = commentMapper.selectById(comment.getParentId());
        if (parent == null) {
            return comment.getId();
        }
        return getRootCommentId(parent);
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
