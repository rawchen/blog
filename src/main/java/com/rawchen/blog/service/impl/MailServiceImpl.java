package com.rawchen.blog.service.impl;

import cn.hutool.core.io.IoUtil;
import cn.hutool.core.util.StrUtil;
import com.rawchen.blog.entity.Article;
import com.rawchen.blog.entity.Comment;
import com.rawchen.blog.entity.User;
import com.rawchen.blog.mapper.ArticleMapper;
import com.rawchen.blog.mapper.CommentMapper;
import com.rawchen.blog.mapper.UserMapper;
import com.rawchen.blog.service.ConfigService;
import com.rawchen.blog.service.MailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 邮件服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class MailServiceImpl implements MailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private ConfigService configService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ArticleMapper articleMapper;

    @Autowired
    private CommentMapper commentMapper;

    @Value("${spring.mail.from}")
    private String from;

    /**
     * 表情代码到文件名的映射
     */
    private static final Map<String, String> SMILIES_MAP = new HashMap<>();
    static {
        SMILIES_MAP.put(":mrgreen:", "icon_mrgreen.png");
        SMILIES_MAP.put(":neutral:", "icon_neutral.png");
        SMILIES_MAP.put(":twisted:", "icon_twisted.png");
        SMILIES_MAP.put(":arrow:", "icon_arrow.png");
        SMILIES_MAP.put(":shock:", "icon_eek.png");
        SMILIES_MAP.put(":smile:", "icon_smile.png");
        SMILIES_MAP.put(":???:", "icon_confused.png");
        SMILIES_MAP.put(":cool:", "icon_cool.png");
        SMILIES_MAP.put(":evil:", "icon_evil.png");
        SMILIES_MAP.put(":grin:", "icon_biggrin.png");
        SMILIES_MAP.put(":idea:", "icon_idea.png");
        SMILIES_MAP.put(":oops:", "icon_redface.png");
        SMILIES_MAP.put(":razz:", "icon_razz.png");
        SMILIES_MAP.put(":roll:", "icon_rolleyes.png");
        SMILIES_MAP.put(":wink:", "icon_wink.png");
        SMILIES_MAP.put(":cry:", "icon_cry.png");
        SMILIES_MAP.put(":eek:", "icon_surprised.png");
        SMILIES_MAP.put(":lol:", "icon_lol.png");
        SMILIES_MAP.put(":mad:", "icon_mad.png");
        SMILIES_MAP.put(":sad:", "icon_sad.png");
        SMILIES_MAP.put(":!:", "icon_exclaim.png");
        SMILIES_MAP.put(":?:", "icon_question.png");
        SMILIES_MAP.put(":guzhang:", "guzhang.png");
        SMILIES_MAP.put(":ok:", "ok.png");
        SMILIES_MAP.put(":chigua:", "chigua.png");
        SMILIES_MAP.put(":waizui:", "waizui.png");
        SMILIES_MAP.put(":keguazi:", "keguazi.png");
    }

    /**
     * 解析文本中的表情代码，替换为图片标签
     */
    private String parseSmilies(String text, String blogUrl) {
        if (StrUtil.isBlank(text)) return "";

        String result = text;
        String baseUrl = blogUrl.endsWith("/") ? blogUrl : blogUrl + "/";

        for (Map.Entry<String, String> entry : SMILIES_MAP.entrySet()) {
            String code = entry.getKey();
            String filename = entry.getValue();
            String imgUrl = baseUrl + "assets/images/smilies/bilibili/" + filename;
            // 转义特殊正则字符
            String escapedCode = Pattern.quote(code);
            String imgTag = "<img class=\"smilies-img\" src=\"" + imgUrl + "\" alt=\"" + code + "\" title=\"" + code + "\" style=\"max-width:30px;display:inline-block;vertical-align:middle;margin:-5px 0 0 0;\" />";
            result = result.replaceAll(escapedCode, imgTag);
        }

        return result;
    }

    @Override
    @Async
    public void sendNewCommentMail(Comment comment, Article article, String blogUrl, String blogName) {
        try {
            // 获取文章作者邮箱
            User author = userMapper.selectById(article.getAuthorId());
            if (author == null || StrUtil.isBlank(author.getEmail())) {
                log.warn("文章作者邮箱为空，跳过发送新评论通知邮件");
                return;
            }

            // 检查是否自己评论自己的文章
            Long commentUserId = comment.getUserId();
            if (commentUserId != null && commentUserId.equals(article.getAuthorId())) {
                log.info("自己评论自己的文章，跳过发送通知邮件");
                return;
            }

            // 获取评论者昵称
            String commentAuthor = getCommentAuthor(comment);

            // 加载模板
            String template = loadTemplate("templates/mail/author.html");

            // 构建评论链接（带锚点）
            String permalink = buildCommentUrl(blogUrl, article, comment);

            String articleUrl = buildArticleUrl(blogUrl, article);

            // 替换模板变量
            String html = template
                    .replace("{blogUrl}", articleUrl)
                    .replace("{blogName}", blogName)
                    .replace("{author}", commentAuthor)
                    .replace("{permalink}", permalink)
                    .replace("{title}", article.getTitle())
                    .replace("{text}", parseSmilies(comment.getContent().replace("\n", "<br>"), blogUrl));

            // 发送邮件
            sendHtmlMail(author.getEmail(), "您的文章有新评论啦！", html);
            log.info("新评论通知邮件发送成功，收件人: {}", author.getEmail());
        } catch (Exception e) {
            log.error("发送新评论通知邮件失败", e);
        }
    }

    @Override
    @Async
    public void sendReplyMail(Comment comment, Comment parentComment, Article article, String blogUrl, String blogName) {
        try {
            // 获取被回复者邮箱
            String toEmail = getCommentEmail(parentComment);
            if (StrUtil.isBlank(toEmail)) {
                log.warn("被回复者邮箱为空，跳过发送回复通知邮件");
                return;
            }

            // 检查是否自己回复自己
            Long commentUserId = comment.getUserId();
            Long parentUserId = parentComment.getUserId();
            if (commentUserId != null && commentUserId.equals(parentUserId)) {
                log.info("自己回复自己，跳过发送通知邮件");
                return;
            }

            // 获取评论者昵称
            String replyAuthor = getCommentAuthor(comment);
            String parentAuthor = getCommentAuthor(parentComment);

            // 加载模板
            String template = loadTemplate("templates/mail/reply.html");

            // 构建链接（permalink跳转到父评论位置）
            String permalink = buildCommentUrl(blogUrl, article, parentComment);
            String commentUrl = buildCommentUrl(blogUrl, article, comment);

            // 替换模板变量
            String html = template
                    .replace("{blogUrl}", blogUrl)
                    .replace("{blogName}", blogName)
                    .replace("{author}", parentAuthor)
                    .replace("{permalink}", permalink)
                    .replace("{title}", article.getTitle())
                    .replace("{text}", parseSmilies(parentComment.getContent().replace("\n", "<br>"), blogUrl))
                    .replace("{replyAuthor}", replyAuthor)
                    .replace("{replyText}", parseSmilies(comment.getContent().replace("\n", "<br>"), blogUrl))
                    .replace("{commentUrl}", commentUrl);

            // 发送邮件
            sendHtmlMail(toEmail, "您的评论有新的回复啦！", html);
            log.info("回复通知邮件发送成功，收件人: {}", toEmail);
        } catch (Exception e) {
            log.error("发送回复通知邮件失败", e);
        }
    }

    /**
     * 发送HTML邮件
     */
    private void sendHtmlMail(String to, String subject, String html) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    /**
     * 加载邮件模板
     */
    private String loadTemplate(String path) {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                throw new RuntimeException("邮件模板不存在: " + path);
            }
            return IoUtil.read(is, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("加载邮件模板失败: " + path, e);
        }
    }

    /**
     * 获取评论者昵称
     */
    private String getCommentAuthor(Comment comment) {
        if (comment.getUserId() != null) {
            User user = userMapper.selectById(comment.getUserId());
            return user != null ? user.getNickname() : "访客";
        }
        return StrUtil.isNotBlank(comment.getNickname()) ? comment.getNickname() : "访客";
    }

    /**
     * 获取评论者邮箱
     */
    private String getCommentEmail(Comment comment) {
        if (comment.getUserId() != null) {
            User user = userMapper.selectById(comment.getUserId());
            return user != null ? user.getEmail() : null;
        }
        return comment.getEmail();
    }

    /**
     * 构建文章链接
     */
    private String buildArticleUrl(String blogUrl, Article article) {
        String baseUrl = blogUrl.endsWith("/") ? blogUrl : blogUrl + "/";
        if (StrUtil.isNotBlank(article.getSlug())) {
            return baseUrl + article.getSlug();
        }
        return baseUrl + article.getId();
    }

    /**
     * 构建评论链接
     */
    private String buildCommentUrl(String blogUrl, Article article, Comment comment) {
        return buildArticleUrl(blogUrl, article) + "#comment-" + comment.getId();
    }
}