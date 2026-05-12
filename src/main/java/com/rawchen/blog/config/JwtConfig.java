package com.rawchen.blog.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT配置
 *
 * @author RawChen
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    /**
     * 密钥
     */
    private String secret;

    /**
     * Token过期时间（毫秒）- 1个月
     */
    private Long expiration = 2592000000L;

    /**
     * Token前缀
     */
    private String tokenPrefix = "Bearer";

    /**
     * Token请求头名称
     */
    private String header = "Authorization";
}
