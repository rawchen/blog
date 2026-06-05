package com.rawchen.blog.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.annotation.AccessLogAnnotation;
import com.rawchen.blog.entity.Article;
import com.rawchen.blog.entity.Config;
import com.rawchen.blog.mapper.ArticleMapper;
import com.rawchen.blog.mapper.ConfigMapper;
import com.rawchen.blog.util.MarkdownUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * RSS和SiteMap控制器
 *
 * @author RawChen
 */
@Slf4j
@Api(tags = "RSS和SiteMap")
@RestController
@RequestMapping
public class FeedController {

    @Autowired
    private ArticleMapper articleMapper;

    @Autowired
    private ConfigMapper configMapper;

    @ApiOperation("RSS订阅")
    @GetMapping(value = "/feed", produces = MediaType.APPLICATION_XML_VALUE)
    @AccessLogAnnotation("RSS")
    public String getRssFeed() {
        // 获取站点配置
        String siteName = getConfigValue("site_name", "Blog");
        String siteDescription = getConfigValue("site_description", "大道至简 大简至极");
        String siteUrl = getConfigValue("site_url", "https://example.com");

        // 获取最新文章（发布和加密）
        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .in(Article::getStatus, 1, 2)
                .orderByDesc(Article::getPublishTime)
                .last("LIMIT 20"));

        // 构建RSS XML
        StringBuilder rss = new StringBuilder();
        rss.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        rss.append("<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\">\n");
        rss.append("  <channel>\n");
        rss.append("    <title>").append(escapeXml(siteName)).append("</title>\n");
        rss.append("    <link>").append(escapeXml(siteUrl)).append("</link>\n");
        rss.append("    <description>").append(escapeXml(siteDescription)).append("</description>\n");
        rss.append("    <language>zh-CN</language>\n");
        rss.append("    <lastBuildDate>").append(formatRfc822Date(LocalDateTime.now())).append("</lastBuildDate>\n");
        rss.append("    <atom:link href=\"").append(escapeXml(siteUrl)).append("/feed\" rel=\"self\" type=\"application/rss+xml\"/>\n");

        for (Article article : articles) {
            rss.append("    <item>\n");
            rss.append("      <title>").append(escapeXml(article.getTitle())).append("</title>\n");
            rss.append("      <link>").append(escapeXml(siteUrl)).append("/").append(article.getId()).append("</link>\n");
            rss.append("      <guid>").append(escapeXml(siteUrl)).append("/").append(article.getId()).append("</guid>\n");
            rss.append("      <pubDate>").append(formatRfc822Date(article.getPublishTime())).append("</pubDate>\n");

            // 加密文章显示提示信息
            if (article.getStatus() == 2) {
                String encryptedSummary = "🔐 该文章需要密码访问，请前往网站查看。";
                rss.append("      <description>").append(escapeXml(encryptedSummary)).append("</description>\n");
                rss.append("      <content:encoded xml:lang=\"zh-CN\"><![CDATA[\n");
                rss.append("<p>🔐 该文章需要密码访问，请前往网站查看。</p>");
                rss.append("\n]]></content:encoded>\n");
            } else {
                rss.append("      <description>").append(escapeXml(article.getSummary() != null ? article.getSummary() : ""))
                        .append("</description>\n");
                // 添加正文内容（后端渲染Markdown为HTML）
                String content = article.getContent();
                if (content != null && !content.isEmpty()) {
                    String contentHtml = MarkdownUtil.render(content);
                    rss.append("      <content:encoded xml:lang=\"zh-CN\"><![CDATA[\n");
                    rss.append(contentHtml);
                    rss.append("\n]]></content:encoded>\n");
                }
            }
            rss.append("    </item>\n");
        }

        rss.append("  </channel>\n");
        rss.append("</rss>");

        return rss.toString();
    }

    @ApiOperation("SiteMap")
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String getSiteMap() {
        String siteUrl = getConfigValue("site_url", "https://example.com");

        // 获取所有已发布文章
        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1)
                .orderByDesc(Article::getPublishTime));

        // 构建SiteMap XML
        StringBuilder sitemap = new StringBuilder();
        sitemap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sitemap.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // 首页
        sitemap.append("  <url>\n");
        sitemap.append("    <loc>").append(escapeXml(siteUrl)).append("</loc>\n");
        sitemap.append("    <changefreq>daily</changefreq>\n");
        sitemap.append("    <priority>1.0</priority>\n");
        sitemap.append("  </url>\n");

        // 归档页
        sitemap.append("  <url>\n");
        sitemap.append("    <loc>").append(escapeXml(siteUrl)).append("/archive</loc>\n");
        sitemap.append("    <changefreq>weekly</changefreq>\n");
        sitemap.append("    <priority>0.8</priority>\n");
        sitemap.append("  </url>\n");

        // 友链页
        sitemap.append("  <url>\n");
        sitemap.append("    <loc>").append(escapeXml(siteUrl)).append("/friends</loc>\n");
        sitemap.append("    <changefreq>weekly</changefreq>\n");
        sitemap.append("    <priority>0.6</priority>\n");
        sitemap.append("  </url>\n");

        // 文章页
        for (Article article : articles) {
            sitemap.append("  <url>\n");
            sitemap.append("    <loc>").append(escapeXml(siteUrl)).append("/article/")
                    .append(article.getId()).append("</loc>\n");
            sitemap.append("    <lastmod>").append(formatW3cDate(article.getUpdateTime())).append("</lastmod>\n");
            sitemap.append("    <changefreq>monthly</changefreq>\n");
            sitemap.append("    <priority>0.7</priority>\n");
            sitemap.append("  </url>\n");
        }

        sitemap.append("</urlset>");

        return sitemap.toString();
    }

    /**
     * 获取配置值
     */
    private String getConfigValue(String key, String defaultValue) {
        try {
            Config config = configMapper.selectOne(new LambdaQueryWrapper<Config>()
                    .eq(Config::getConfigKey, key));
            return config != null && config.getConfigValue() != null
                    ? config.getConfigValue()
                    : defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    /**
     * 转义XML特殊字符（先解码已有的HTML实体，避免双重转义）
     */
    private String escapeXml(String str) {
        if (str == null) return "";
        return str.replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    /**
     * 格式化为RFC822日期格式（RSS标准）
     */
    private String formatRfc822Date(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);
        return dateTime.atZone(ZoneId.of("Asia/Shanghai")).format(formatter);
    }

    /**
     * 格式化为W3C日期格式（SiteMap标准）
     */
    private String formatW3cDate(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
