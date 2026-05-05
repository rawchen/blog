package com.rawchen.blog.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.entity.Article;
import com.rawchen.blog.entity.Config;
import com.rawchen.blog.mapper.ArticleMapper;
import com.rawchen.blog.mapper.ConfigMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

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
    public String getRssFeed() {
        // 获取站点配置
        String siteTitle = getConfigValue("site_title", "RawChen Blog");
        String siteDescription = getConfigValue("site_description", "喜欢什么就去做吧!");
        String siteUrl = getConfigValue("site_url", "https://rawchen.com");

        // 获取最新文章
        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1)
                .orderByDesc(Article::getPublishTime)
                .last("LIMIT 20"));

        // 构建RSS XML
        StringBuilder rss = new StringBuilder();
        rss.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        rss.append("<rss version=\"2.0\">\n");
        rss.append("  <channel>\n");
        rss.append("    <title>").append(escapeXml(siteTitle)).append("</title>\n");
        rss.append("    <link>").append(escapeXml(siteUrl)).append("</link>\n");
        rss.append("    <description>").append(escapeXml(siteDescription)).append("</description>\n");
        rss.append("    <language>zh-CN</language>\n");
        rss.append("    <lastBuildDate>").append(formatRfc822Date(LocalDateTime.now())).append("</lastBuildDate>\n");

        for (Article article : articles) {
            rss.append("    <item>\n");
            rss.append("      <title>").append(escapeXml(article.getTitle())).append("</title>\n");
            rss.append("      <link>").append(escapeXml(siteUrl)).append("/article/").append(article.getId()).append("</link>\n");
            rss.append("      <guid>").append(escapeXml(siteUrl)).append("/article/").append(article.getId()).append("</guid>\n");
            rss.append("      <pubDate>").append(formatRfc822Date(article.getPublishTime())).append("</pubDate>\n");
            rss.append("      <description>").append(escapeXml(article.getSummary() != null ? article.getSummary() : ""))
                    .append("</description>\n");
            rss.append("    </item>\n");
        }

        rss.append("  </channel>\n");
        rss.append("</rss>");

        return rss.toString();
    }

    @ApiOperation("SiteMap")
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String getSiteMap() {
        String siteUrl = getConfigValue("site_url", "https://rawchen.com");

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
     * 转义XML特殊字符
     */
    private String escapeXml(String str) {
        if (str == null) return "";
        return str.replace("&", "&amp;")
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
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss z");
        return dateTime.format(DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss +0800"));
    }

    /**
     * 格式化为W3C日期格式（SiteMap标准）
     */
    private String formatW3cDate(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
