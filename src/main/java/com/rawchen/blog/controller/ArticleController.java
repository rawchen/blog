package com.rawchen.blog.controller;

import cn.hutool.json.JSONUtil;
import com.rawchen.blog.common.Constants;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.ArticleDTO;
import com.rawchen.blog.entity.Article;
import com.rawchen.blog.entity.ArticleVersion;
import com.rawchen.blog.service.ArticleService;
import com.rawchen.blog.vo.ArticleDetailVO;
import com.rawchen.blog.vo.ArticleEditVO;
import com.rawchen.blog.vo.ArticleVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.io.IOException;
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
 * 文章控制器
 *
 * @author RawChen
 */
@Api(tags = "文章管理")
@Slf4j
@RestController
@RequestMapping("/article")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    @ApiOperation("分页查询文章列表（前台）")
    @GetMapping("/list")
    public R<PageResult<ArticleVO>> getArticleList(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) String keyword) {
        return R.ok(articleService.getArticleList(current, size, categoryId, tagId, keyword));
    }

    @ApiOperation("获取文章详情（前台）")
    @GetMapping("/detail/{id}")
    public R<ArticleDetailVO> getArticleDetail(
            @PathVariable Long id,
            @RequestParam(required = false) String password) {
        return R.ok(articleService.getArticleDetail(id, password));
    }

    @ApiOperation("根据别名获取文章")
    @GetMapping("/slug/{slug}")
    public R<ArticleDetailVO> getArticleBySlug(@PathVariable String slug) {
        return R.ok(articleService.getArticleBySlug(slug));
    }

    @ApiOperation("增加浏览量")
    @PostMapping("/view/{id}")
    public R<Void> incrementViewCount(@PathVariable Long id) {
        articleService.incrementViewCount(id);
        return R.ok();
    }

    @ApiOperation("点赞文章")
    @PostMapping("/like/{id}")
    public R<Void> incrementLikeCount(@PathVariable Long id) {
        articleService.incrementLikeCount(id);
        return R.ok();
    }

    @ApiOperation("搜索文章")
    @GetMapping("/search")
    public R<PageResult<ArticleVO>> searchArticles(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String keyword) {
        return R.ok(articleService.searchArticles(current, size, keyword));
    }

    @ApiOperation("时间线归档")
    @GetMapping("/timeline")
    public R<PageResult<ArticleVO>> getArticleTimeline(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return R.ok(articleService.getArticleTimeline(current, size));
    }

    @ApiOperation("随机文章")
    @GetMapping("/random")
    public R<List<ArticleVO>> getRandomArticles(
            @RequestParam(defaultValue = "5") Integer limit) {
        return R.ok(articleService.getRandomArticles(limit));
    }

    @ApiOperation("推荐文章")
    @GetMapping("/recommend")
    public R<List<ArticleVO>> getRecommendArticles(
            @RequestParam(defaultValue = "5") Integer limit) {
        return R.ok(articleService.getRecommendArticles(limit));
    }

    @ApiOperation("相关文章")
    @GetMapping("/{id}/related")
    public R<List<ArticleVO>> getRelatedArticles(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") Integer limit) {
        return R.ok(articleService.getRelatedArticles(id, limit));
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("分页查询文章列表（后台）")
    @GetMapping("/admin/list")
    @PreAuthorize("hasAuthority('content:article:query')")
    public R<PageResult<ArticleVO>> getArticleListAdmin(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return R.ok(articleService.getArticleListAdmin(current, size, keyword, status));
    }

    @ApiOperation("根据ID获取文章")
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:article:query')")
    public R<ArticleEditVO> getArticleById(@PathVariable Long id) {
        return R.ok(articleService.getArticleEditById(id));
    }

    @ApiOperation("创建文章")
    @PostMapping("/admin")
    @PreAuthorize("hasAuthority('content:article:add')")
    public R<Long> createArticle(@Valid @RequestBody ArticleDTO articleDTO) {
        return R.ok(articleService.createArticle(articleDTO));
    }

    @ApiOperation("更新文章")
    @PutMapping("/admin")
    @PreAuthorize("hasAuthority('content:article:edit')")
    public R<Void> updateArticle(@Valid @RequestBody ArticleDTO articleDTO) {
        articleService.updateArticle(articleDTO);
        return R.ok();
    }

    @ApiOperation("删除文章")
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:article:delete')")
    public R<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return R.ok();
    }

    @ApiOperation("批量删除文章")
    @PostMapping("/admin/batch-delete")
    @PreAuthorize("hasAuthority('content:article:delete')")
    public R<Void> batchDeleteArticles(@RequestBody List<Long> ids) {
        articleService.batchDeleteArticles(ids);
        return R.ok();
    }

    @ApiOperation("保存草稿")
    @PostMapping("/admin/draft")
    @PreAuthorize("hasAuthority('content:article:add')")
    public R<Long> saveDraft(@Valid @RequestBody ArticleDTO articleDTO) {
        return R.ok(articleService.saveDraft(articleDTO));
    }

    @ApiOperation("获取草稿")
    @GetMapping("/admin/draft/{articleId}")
    @PreAuthorize("hasAuthority('content:article:query')")
    public R<Article> getDraft(@PathVariable Long articleId) {
        return R.ok(articleService.getDraft(articleId));
    }

    @ApiOperation("获取文章版本历史")
    @GetMapping("/admin/{id}/versions")
    @PreAuthorize("hasAuthority('content:article:query')")
    public R<List<ArticleVersion>> getArticleVersions(@PathVariable Long id) {
        return R.ok(articleService.getArticleVersions(id));
    }

    @ApiOperation("恢复文章版本")
    @PostMapping("/admin/{articleId}/restore/{versionId}")
    @PreAuthorize("hasAuthority('content:article:edit')")
    public R<Void> restoreArticleVersion(@PathVariable Long articleId, @PathVariable Long versionId) {
        articleService.restoreArticleVersion(articleId, versionId);
        return R.ok();
    }

    @ApiOperation("AI生成文章摘要")
    @PostMapping("/admin/ai/summary")
    @PreAuthorize("hasAuthority('content:article:add')")
    public R<String> generateSummary(@RequestBody Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            if (content == null || content.trim().isEmpty()) {
                return R.fail("文章内容不能为空");
            }

            // 限制内容长度，避免token超限
            String truncatedContent = content.length() > 3000
                    ? content.substring(0, 3000) + "..."
                    : content;

            // 构建生成摘要的提示词
            String systemPrompt = "# 角色设定\n" +
                    "你是一个专业的文章摘要生成助手，核心职责是从文章内容中精准提取核心信息，生成简洁、准确的摘要。\n" +
                    "\n" +
                    "# 执行准则\n" +
                    "- 摘要必须完全基于文章内容生成，不得添加文章外的信息\n" +
                    "- 摘要需包含文章的核心观点和关键信息\n" +
                    "- 语言简洁明了，突出重点\n" +
                    "\n" +
                    "# 输出规范\n" +
                    "- 输出结构：仅输出摘要内容，无需附加任何解释性内容\n" +
                    "- 字数限制：控制在50-150字符左右\n" +
                    "- 语言风格：使用陈述性短句，简洁明了\n";

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);

            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", "请为以下文章生成一个摘要：\n\n" + truncatedContent);
            messages.add(userMsg);

            URL url = new URL(Constants.DEEPSEEK_BASE_URL + "/chat/completions");
            HttpURLConnection conn = null;
            InputStream inputStream = null;

            try {
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + Constants.DEEPSEEK_API_KEY);
                conn.setDoOutput(true);
                conn.setDoInput(true);
                conn.setConnectTimeout(30000);
                conn.setReadTimeout(60000);

                Map<String, Object> body = new HashMap<>();
                body.put("model", Constants.DEEPSEEK_CHAT_MODEL);
                body.put("messages", messages);
                body.put("stream", false);
                body.put("temperature", 0.7);
                body.put("max_tokens", 200);
                String jsonBody = JSONUtil.toJsonStr(body);
                log.info("摘要生成请求体: {}", jsonBody);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                log.info("摘要生成响应码: {}", responseCode);

                if (responseCode != HttpURLConnection.HTTP_OK) {
                    String error = cn.hutool.core.io.IoUtil.read(conn.getErrorStream(), StandardCharsets.UTF_8);
                    log.error("摘要生成失败: {}", error);
                    return R.fail("摘要生成失败: " + error);
                }

                inputStream = conn.getInputStream();
                String responseText = cn.hutool.core.io.IoUtil.read(inputStream, StandardCharsets.UTF_8);
                log.info("摘要生成响应: {}", responseText);

                // 解析响应
                Map<String, Object> responseJson = JSONUtil.toBean(responseText, Map.class);
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseJson.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, String> message = (Map<String, String>) choice.get("message");
                    String summary = message != null ? message.get("content") : null;

                    if (summary != null) {
                        // 清理摘要
                        summary = summary.trim();
                        log.info("生成的摘要: {}", summary);
                        return R.ok(summary);
                    }
                }

                return R.fail("摘要生成失败: 响应格式错误");

            } catch (Exception e) {
                log.error("摘要生成请求处理失败", e);
                return R.fail("摘要生成失败: " + e.getMessage());
            } finally {
                if (inputStream != null) {
                    try {
                        inputStream.close();
                    } catch (IOException e) {
                        log.error("关闭输入流失败", e);
                    }
                }
                if (conn != null) {
                    conn.disconnect();
                }
            }
        } catch (Exception e) {
            log.error("摘要生成初始化失败", e);
            return R.fail("摘要生成初始化失败: " + e.getMessage());
        }
    }
}
