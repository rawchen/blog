package com.rawchen.blog.service;

import com.rawchen.blog.entity.Article;
import com.rawchen.blog.entity.Comment;

/**
 * 邮件服务接口
 *
 * @author RawChen
 */
public interface MailService {

    /**
     * 发送新评论通知给文章作者
     *
     * @param comment   新评论
     * @param article   文章
     * @param blogUrl   博客地址
     * @param blogName  博客名称
     */
    void sendNewCommentMail(Comment comment, Article article, String blogUrl, String blogName);

    /**
     * 发送回复通知给被回复者
     *
     * @param comment       回复评论
     * @param parentComment 被回复的父评论
     * @param article       文章
     * @param blogUrl       博客地址
     * @param blogName      博客名称
     */
    void sendReplyMail(Comment comment, Comment parentComment, Article article, String blogUrl, String blogName);
}