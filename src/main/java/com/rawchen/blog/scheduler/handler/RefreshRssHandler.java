package com.rawchen.blog.scheduler.handler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rawchen.blog.entity.Moment;
import com.rawchen.blog.mapper.MomentMapper;
import com.rawchen.blog.service.MomentService;
import com.rawchen.blog.scheduler.HandlerParam;
import com.rawchen.blog.scheduler.JobHandler;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobDataMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * RSS订阅刷新处理器
 * 定时从RSS服务接口获取订阅文章并同步到数据库
 *
 * @author RawChen
 */
@Slf4j
@Component
public class RefreshRssHandler implements JobHandler {

    @Autowired
    private MomentMapper momentMapper;

    @Autowired
    private MomentService momentService;

    @Autowired(required = false)
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int DEFAULT_ARTICLE_COUNT = 1000;
    private static final int DEFAULT_CONNECT_TIMEOUT = 30000;
    private static final int DEFAULT_READ_TIMEOUT = 60000;

    @Override
    public String execute(JobDataMap context) {
        // 从 handlerParams JSON 字符串中解析参数
        String handlerParamsJson = context.getString("handlerParams");
        String rssUrl = null;
        String username = null;
        String password = null;

        if (handlerParamsJson != null && !handlerParamsJson.isEmpty()) {
            try {
                JsonNode paramsNode = objectMapper.readTree(handlerParamsJson);
                rssUrl = paramsNode.has("rssUrl") ? paramsNode.get("rssUrl").asText() : null;
                username = paramsNode.has("username") ? paramsNode.get("username").asText() : null;
                password = paramsNode.has("password") ? paramsNode.get("password").asText() : null;
            } catch (Exception e) {
                log.error("解析处理器参数失败: {}", handlerParamsJson, e);
                return "解析处理器参数失败";
            }
        }

        // 规范化baseUrl：确保不包含/api/greader.php路径
        if (rssUrl == null || rssUrl.isEmpty()) {
            rssUrl = "https://rss.rawchen.com";
        } else if (rssUrl.contains("/api/greader.php")) {
            rssUrl = rssUrl.substring(0, rssUrl.indexOf("/api/greader.php"));
        }

        // 构建API基础路径
        String apiBaseUrl = rssUrl + "/api/greader.php";

        log.info("开始刷新RSS订阅: {}, username={}", rssUrl, username);

        try {
            RestTemplate client = restTemplate != null ? restTemplate : new RestTemplate();

            // 1. 登录获取Auth Token
            String authUrl = apiBaseUrl + "/accounts/ClientLogin"
                    + "?Email=" + encodeParam(username)
                    + "&Passwd=" + encodeParam(password);

            log.debug("登录URL: {}", authUrl);

            ResponseEntity<String> loginResponse = client.getForEntity(authUrl, String.class);
            if (!loginResponse.getStatusCode().is2xxSuccessful()) {
                return "RSS登录失败";
            }

            String loginBody = loginResponse.getBody();
            String authToken = extractAuthToken(loginBody);
            if (authToken == null) {
                log.error("获取Auth Token失败: {}", loginBody);
                return "获取Auth Token失败";
            }

            // 2. 获取订阅列表
            String subListUrl = apiBaseUrl + "/reader/api/0/subscription/list?output=json";
            JsonNode subscriptions = fetchWithAuth(client, subListUrl, authToken, "subscriptions");

            Map<String, JsonNode> subscriptionMap = new HashMap<>();
            if (subscriptions != null) {
                for (JsonNode sub : subscriptions) {
                    String id = sub.has("id") ? sub.get("id").asText() : "";
                    subscriptionMap.put(id, sub);
                }
            }

            // 3. 获取文章列表
            String articlesUrl = apiBaseUrl + "/reader/api/0/stream/contents/reading-list?n=" + DEFAULT_ARTICLE_COUNT;
            JsonNode items = fetchWithAuth(client, articlesUrl, authToken, "items");

            if (items == null || !items.isArray()) {
                return "获取文章列表失败";
            }

            // 4. 清空数据库
            momentMapper.delete(new LambdaQueryWrapper<>());
            log.info("已清空原有动态数据");

            // 5. 批量插入新数据
            List<Moment> moments = new ArrayList<>();
            for (JsonNode item : items) {
                Moment moment = convertToMoment(item, subscriptionMap, rssUrl);
                if (moment != null) {
                    moments.add(moment);
                }
            }

            // 批量插入
            momentService.saveBatch(moments);

            String result = String.format("RSS订阅刷新完成: 获取%d条, 插入%d条", moments.size(), moments.size());
            log.info(result);
            return result;

        } catch (Exception e) {
            log.error("刷新RSS订阅异常", e);
            return "刷新RSS订阅失败: " + e.getMessage();
        }
    }

    @Override
    public String getName() {
        return "refreshRss";
    }

    @Override
    public String getDescription() {
        return "刷新RSS订阅";
    }

    @Override
    public List<HandlerParam> getParams() {
        return Arrays.asList(
                HandlerParam.builder()
                        .name("rssUrl")
                        .label("FreshRSS服务")
                        .type("string")
                        .required(true)
                        .placeholder("https://rss.rawchen.com")
                        .tooltip("FreshRSS服务部署公网地址")
                        .build(),
                HandlerParam.builder()
                        .name("username")
                        .label("用户名")
                        .type("string")
                        .required(true)
                        .placeholder("请输入登录用户名")
                        .tooltip("RSS服务的登录用户名")
                        .build(),
                HandlerParam.builder()
                        .name("password")
                        .label("密码")
                        .type("password")
                        .required(true)
                        .placeholder("请输入登录密码")
                        .tooltip("RSS服务的登录密码")
                        .build()
        );
    }

    /**
     * 从登录响应中提取Auth Token
     */
    private String extractAuthToken(String response) {
        if (response == null) return null;
        int idx = response.indexOf("Auth=");
        if (idx != -1) {
            return response.substring(idx + 5).trim();
        }
        return null;
    }

    /**
     * 带认证的API请求
     */
    private JsonNode fetchWithAuth(RestTemplate client, String url, String authToken, String arrayKey) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "GoogleLogin auth=" + authToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = client.exchange(url, HttpMethod.GET, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("API请求失败: {} - {}", url, response.getStatusCode());
                return null;
            }

            String body = response.getBody();
            if (body == null) return null;

            JsonNode root = objectMapper.readTree(body);
            if (arrayKey != null) {
                return root.has(arrayKey) ? root.get(arrayKey) : null;
            }
            return root;

        } catch (Exception e) {
            log.error("API请求异常: {}", url, e);
            return null;
        }
    }

    /**
     * 将API返回的item转换为Moment实体
     */
    private Moment convertToMoment(JsonNode item, Map<String, JsonNode> subscriptionMap, String rssUrl) {
        try {
            // 提取基本信息
            String title = item.has("title") ? item.get("title").asText() : "";
            String author = item.has("author") ? item.get("author").asText() : "";

            // 提取链接
            String link = "";
            if (item.has("alternate") && item.get("alternate").isArray()) {
                JsonNode alt = item.get("alternate").get(0);
                if (alt != null && alt.has("href")) {
                    link = alt.get("href").asText();
                }
            }

            // 提取站点名称
            String siteName = "";
            if (item.has("origin") && item.get("origin").has("title")) {
                siteName = item.get("origin").get("title").asText();
            }

            // 提取摘要内容
            String summaryContent = "";
            if (item.has("summary") && item.get("summary").has("content")) {
                summaryContent = item.get("summary").get("content").asText();
            }
            String description = truncateText(stripHtml(summaryContent), 99);

            // 提取首张图片
            String img = extractFirstImage(summaryContent);

            // 提取图标
            String icon = "";
            String streamId = item.has("origin") && item.get("origin").has("streamId")
                    ? item.get("origin").get("streamId").asText() : "";
            if (subscriptionMap.containsKey(streamId)) {
                JsonNode sub = subscriptionMap.get(streamId);
                if (sub.has("iconUrl")) {
                    String iconUrl = sub.get("iconUrl").asText();
                    int lastSlash = iconUrl.lastIndexOf('/');
                    icon = iconUrl.substring(lastSlash + 1);
                    if (!icon.isEmpty()) {
                        icon = rssUrl + "/" + icon;
                    }
                }
            }

            // 提取发布时间
            LocalDateTime publishTime = null;
            if (item.has("published")) {
                long timestamp = item.get("published").asLong();
                publishTime = LocalDateTime.ofInstant(
                        Instant.ofEpochSecond(timestamp),
                        ZoneId.systemDefault()
                );
            }

            Moment moment = new Moment();
            moment.setTitle(title);
            moment.setAuthor(author);
            moment.setLink(link);
            moment.setSiteName(siteName);
            moment.setDescription(description);
            moment.setImg(img);
            moment.setIcon(icon);
            moment.setPublishTime(publishTime);

            return moment;

        } catch (Exception e) {
            log.warn("转换文章失败", e);
            return null;
        }
    }

    /**
     * 去除HTML标签
     */
    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", "")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&quot;", "\"")
                .replaceAll("&#39;", "'")
                .trim();
    }

    /**
     * 截断文本
     */
    private String truncateText(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    /**
     * 提取首张图片src（过滤base64格式）
     */
    private String extractFirstImage(String html) {
        if (html == null) return null;
        // 匹配 <img src="...">
        int imgIdx = html.indexOf("<img");
        if (imgIdx == -1) return null;

        int srcIdx = html.indexOf("src", imgIdx);
        if (srcIdx == -1) return null;

        int start = html.indexOf("\"", srcIdx);
        if (start == -1) {
            start = html.indexOf("'", srcIdx);
        }
        if (start == -1) return null;

        int end = html.indexOf("\"", start + 1);
        if (end == -1) {
            end = html.indexOf("'", start + 1);
        }
        if (end == -1) return null;

        String src = html.substring(start + 1, end);

        // 过滤掉 base64 格式的图片（太长且无法直接使用）
        if (src != null && src.startsWith("data:image")) {
            return null;
        }

        return src;
    }

    /**
     * URL编码参数
     */
    private String encodeParam(String value) {
        if (value == null) return "";
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (Exception e) {
            return value;
        }
    }
}
