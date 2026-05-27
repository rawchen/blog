package com.rawchen.blog.controller;

import cn.hutool.core.io.IoUtil;
import cn.hutool.json.JSONUtil;
import com.rawchen.blog.annotation.OperationLogAnnotation;
import com.rawchen.blog.common.R;
import com.rawchen.blog.config.DeepseekConfig;
import com.rawchen.blog.dto.ArticleDTO;
import com.rawchen.blog.entity.Article;
import com.rawchen.blog.enums.OperationType;
import com.rawchen.blog.enums.TargetType;
import com.rawchen.blog.service.ArticleService;
import com.rawchen.blog.service.TagService;
import com.rawchen.blog.vo.WebScraperResultVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 网页文章采集控制器
 *
 * @author RawChen
 */
@Api(tags = "网页文章采集")
@Slf4j
@RestController
@RequestMapping("/api/scraper")
public class WebScraperController {

    @Autowired
    private ArticleService articleService;

    @Autowired
    private TagService tagService;

    @Autowired
    private DeepseekConfig deepseekConfig;

    @ApiOperation("获取采集文章数量")
    @GetMapping("/count")
    public R<Long> getScraperArticleCount() {
        long count = articleService.lambdaQuery()
                .eq(Article::getSource, 2)
                .count();
        return R.ok(count);
    }

    @ApiOperation("采集网页文章")
    @PostMapping("/fetch")
    @PreAuthorize("hasRole('ADMIN')")
    public R<WebScraperResultVO> fetchArticle(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        if (url == null || url.trim().isEmpty()) {
            return R.fail("请输入网页链接");
        }

        try {
            // 1. 获取HTML源码
            String htmlContent = fetchHtmlContent(url);
            if (htmlContent == null || htmlContent.isEmpty()) {
                return R.fail("无法获取网页内容");
            }

            // 2. 解析HTML并清洗
            Document doc = Jsoup.parse(htmlContent);
            Element body = doc.body();

            // 清洗：保留img、pre、code等标签，去掉脚本、样式等
            Safelist safelist = Safelist.basicWithImages()
                    .addTags("pre", "code", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "table", "thead", "tbody", "tr", "th", "td")
                    .removeTags("script", "style", "iframe", "object", "embed", "applet", "nav", "footer", "aside")
                    .removeAttributes(":all", "class", "style", "id", "onclick", "onload", "onerror");

            String cleanHtml = Jsoup.clean(body.html(), safelist);

            // 3. 通过DeepSeek提取标题、内容和标签
            WebScraperResultVO result = extractByAI(cleanHtml, url);

            return R.ok(result);
        } catch (Exception e) {
            log.error("采集网页失败: {}", url, e);
            return R.fail("采集失败: " + e.getMessage());
        }
    }

    @ApiOperation("保存采集的文章")
    @PostMapping("/save")
    @PreAuthorize("hasRole('ADMIN')")
    @OperationLogAnnotation(type = OperationType.CREATE, target = TargetType.ARTICLE, description = "采集文章保存", recordDetail = true)
    public R<Long> saveScraperArticle(@RequestBody ArticleDTO articleDTO) {
        // 设置来源为抓取
        articleDTO.setSource(2);
        articleDTO.setType(Article.ArticleType.POST);

        Long articleId = articleService.createArticle(articleDTO);
        return R.ok(articleId);
    }

    /**
     * 获取网页HTML内容
     */
    private String fetchHtmlContent(String urlStr) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(60000);
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
        conn.setRequestProperty("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8");

        int responseCode = conn.getResponseCode();
        if (responseCode != HttpURLConnection.HTTP_OK) {
            throw new Exception("HTTP响应码: " + responseCode);
        }

        InputStream inputStream = conn.getInputStream();
        String content = IoUtil.read(inputStream, StandardCharsets.UTF_8);
        conn.disconnect();

        return content;
    }

    /**
     * 通过DeepSeek AI提取标题、内容和标签
     */
    private WebScraperResultVO extractByAI(String cleanHtml, String sourceUrl) throws Exception {
        // 限制内容长度（增加以保留更多图片和代码）
        String truncatedHtml = cleanHtml.length() > 15000
                ? cleanHtml.substring(0, 15000) + "...[内容过长已截断]"
                : cleanHtml;

        String systemPrompt = "# 角色设定\n" +
                "你是一个专业的网页内容提取助手，负责从HTML内容中提取结构化的文章信息。\n" +
                "\n" +
                "# 任务目标\n" +
                "从提供的HTML内容中提取以下信息：\n" +
                "1. 文章标题（提取最合适的标题，优先h1、title标签或明显的标题文本）\n" +
                "2. 文章正文内容（转换为Markdown格式，必须保留所有图片和代码块）\n" +
                "3. 总结最多3个相关标签（标签应该简短、准确，反映文章主题）\n" +
                "\n" +
                "# 输出格式要求\n" +
                "严格按照以下JSON格式输出，不要添加任何其他内容：\n" +
                "{\"title\":\"文章标题\",\"content\":\"Markdown格式的正文内容\",\"tags\":[\"标签1\",\"标签2\",\"标签3\"]}\n" +
                "\n" +
                "# 图片处理规范（非常重要）\n" +
                "- 所有<img>标签必须转换为Markdown图片格式\n" +
                "- 格式：![alt描述](图片URL)\n" +
                "- 如果图片有alt属性则使用alt作为描述，否则使用\"图片\"\n" +
                "- 图片URL必须是完整路径，如果相对路径需要转为绝对路径\n" +
                "- 不要遗漏任何图片\n" +
                "\n" +
                "# 代码块处理规范（非常重要）\n" +
                "- <pre><code>或<pre class=\"language-xxx\">必须转为Markdown代码块\n" +
                "- 格式：```语言名\\n代码内容\\n```\n" +
                "- 常见语言：java、javascript、python、html、css、sql、shell、json等\n" +
                "- 如果无法识别语言，使用```text\n" +
                "- 保持代码原有缩进和格式\n" +
                "- <code>单独出现用反引号包裹：`code`\n" +
                "\n" +
                "# 其他内容转换规范\n" +
                "- 标题转换为Markdown标题格式（# 二级标题，## 三级标题等）\n" +
                "- 段落之间保持空行\n" +
                "- 列表转换为Markdown列表格式\n" +
                "- 链接转换为Markdown链接格式 [文本](链接)\n" +
                "- 强调文本转换为Markdown强调格式\n" +
                "- 表格转换为Markdown表格格式\n" +
                "- 去除无意义的广告、导航、侧边栏内容\n" +
                "- 只提取真正的文章正文内容\n";

        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", "网页源URL：" + sourceUrl + "\n（注意：如果图片或链接是相对路径，请基于此URL转为绝对路径）\n\n请从以下HTML内容中提取文章标题、正文内容（转为Markdown，必须保留所有图片和代码块）和最多3个标签：\n\n" + truncatedHtml);
        messages.add(userMsg);

        URL apiUrl = new URL(deepseekConfig.getBaseUrl() + "/chat/completions");
        HttpURLConnection conn = (HttpURLConnection) apiUrl.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + deepseekConfig.getApiKey());
        conn.setDoOutput(true);
        conn.setDoInput(true);
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(120000);

        Map<String, Object> body = new HashMap<>();
        body.put("model", deepseekConfig.getChatModel());
        body.put("messages", messages);
        body.put("stream", false);
        body.put("temperature", 0.3);
        body.put("max_tokens", 8000);
        String jsonBody = JSONUtil.toJsonStr(body);
        log.info("网页采集请求体长度: {}", jsonBody.length());

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int responseCode = conn.getResponseCode();
        log.info("网页采集响应码: {}", responseCode);

        if (responseCode != HttpURLConnection.HTTP_OK) {
            String error = IoUtil.read(conn.getErrorStream(), StandardCharsets.UTF_8);
            log.error("DeepSeek API调用失败: {}", error);
            throw new Exception("AI提取失败: " + error);
        }

        InputStream inputStream = conn.getInputStream();
        String responseText = IoUtil.read(inputStream, StandardCharsets.UTF_8);
        log.info("网页采集响应长度: {}", responseText.length());

        // 解析响应
        Map<String, Object> responseJson = JSONUtil.toBean(responseText, Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseJson.get("choices");

        if (choices != null && !choices.isEmpty()) {
            Map<String, Object> choice = choices.get(0);
            Map<String, String> message = (Map<String, String>) choice.get("message");
            String content = message != null ? message.get("content") : null;

            if (content != null) {
                content = content.trim();
                // 去除可能的markdown代码块包裹
                if (content.startsWith("```json")) {
                    content = content.substring(7);
                }
                if (content.startsWith("```")) {
                    content = content.substring(3);
                }
                if (content.endsWith("```")) {
                    content = content.substring(0, content.length() - 3);
                }
                content = content.trim();

                log.info("AI提取结果: {}", content);

                // 解析JSON结果
                try {
                    Map<String, Object> result = JSONUtil.toBean(content, Map.class);
                    WebScraperResultVO vo = new WebScraperResultVO();
                    vo.setTitle((String) result.get("title"));
                    vo.setContent((String) result.get("content"));
                    vo.setSourceUrl(sourceUrl);

                    List<String> tags = (List<String>) result.get("tags");
                    vo.setTags(tags != null ? tags : new ArrayList<>());

                    // 自动生成摘要（从内容提取前150字）
                    String mdContent = vo.getContent();
                    if (mdContent != null && mdContent.length() > 150) {
                        vo.setSummary(mdContent.substring(0, 150).replaceAll("[#*`\\[\\]]", "") + "...");
                    } else if (mdContent != null) {
                        vo.setSummary(mdContent.replaceAll("[#*`\\[\\]]", ""));
                    }

                    return vo;
                } catch (Exception e) {
                    log.error("解析AI返回JSON失败: {}", content, e);
                    throw new Exception("解析结果失败");
                }
            }
        }

        conn.disconnect();
        throw new Exception("AI未返回有效内容");
    }
}