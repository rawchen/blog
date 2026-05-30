package com.rawchen.blog.controller;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 图片代理控制器 - 用于绑过防盗链
 *
 * @author RawChen
 */
@Api(tags = "图片代理")
@RestController
@RequestMapping("/api/image")
public class ImageProxyController {

    // 允许的图片域名白名单（安全措施）
    private static final Set<String> ALLOWED_DOMAINS = new HashSet<>(Arrays.asList(
            "sinaimg.cn", "weibo.com", "zhimg.com", "zhihu.com",
            "qpic.cn", "qq.com", "clouddn.com", "bcebos.com",
            "aliyuncs.com", "oss-cn", "cos.", "cdn.",
            "imgur.com", "githubusercontent.com", "wordpress.com"
    ));

    private static final Set<String> ALLOWED_TYPES = new HashSet<>(Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"
    ));

    @ApiOperation("图片代理")
    @GetMapping("/proxy")
    public ResponseEntity<byte[]> proxyImage(@RequestParam String url) {
        if (url == null || url.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // 安全检查：验证URL格式
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return ResponseEntity.badRequest().build();
        }

        // 检查域名白名单（可选，可根据需求开启）
        // if (!isAllowedDomain(url)) {
        //     return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        // }

        HttpURLConnection connection = null;
        try {
            URL imageUrl = new URL(url);
            connection = (HttpURLConnection) imageUrl.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(30000);
            connection.setInstanceFollowRedirects(true);

            // 设置请求头模拟浏览器
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36");
            connection.setRequestProperty("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8");
            connection.setRequestProperty("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7");
            connection.setRequestProperty("Connection", "keep-alive");
            // Chrome 安全头
            connection.setRequestProperty("sec-ch-ua", "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"");
            connection.setRequestProperty("sec-ch-ua-mobile", "?0");
            connection.setRequestProperty("sec-ch-ua-platform", "\"macOS\"");
            connection.setRequestProperty("Sec-Fetch-Dest", "image");
            connection.setRequestProperty("Sec-Fetch-Mode", "no-cors");
            connection.setRequestProperty("Sec-Fetch-Site", "same-site");
            // Referer 设置为主站域名（去掉pic.等CDN前缀）
            String host = imageUrl.getHost();
            String mainHost = host.replaceFirst("^(pic|img|cdn|static)\\.", "");
            String referer = imageUrl.getProtocol() + "://" + mainHost + "/";
            connection.setRequestProperty("Referer", referer);

            int responseCode = connection.getResponseCode();
            System.out.println("[ImageProxy] URL: " + url + " -> Response: " + responseCode);
            if (responseCode != HttpURLConnection.HTTP_OK) {
                System.out.println("[ImageProxy] Failed with code: " + responseCode);
                return ResponseEntity.status(responseCode).build();
            }

            String contentType = connection.getContentType();
            if (contentType == null || !ALLOWED_TYPES.stream().anyMatch(contentType::contains)) {
                contentType = "image/jpeg"; // 默认
            }

            // 读取图片数据
            try (InputStream is = connection.getInputStream()) {
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] temp = new byte[8192];
                int n;
                while ((n = is.read(temp)) != -1) {
                    buffer.write(temp, 0, n);
                }
                byte[] data = buffer.toByteArray();

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType(contentType.split(";")[0].trim()));
                headers.setContentLength(data.length);
                // 缓存1天
                headers.setCacheControl("public, max-age=86400");

                return new ResponseEntity<>(data, headers, HttpStatus.OK);
            }
        } catch (Exception e) {
            System.err.println("[ImageProxy] Error proxying image: " + url + " - " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
