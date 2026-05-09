package com.rawchen.blog.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * DeepSeek AI配置类
 *
 * @author RawChen
 * @date 2025-05-09
 */
@Data
@Component
@ConfigurationProperties(prefix = "deepseek")
public class DeepseekConfig {

    /**
     * 是否启用
     */
    private Boolean enabled;

    /**
     * API Key
     */
    private String apiKey;

    /**
     * API基础URL
     */
    private String baseUrl = "https://api.deepseek.com";

    /**
     * 聊天模型
     */
    private String chatModel = "deepseek-v4-flash";
}
