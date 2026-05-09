package com.rawchen.blog.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 阿里云OSS配置类
 *
 * @author RawChen
 * @date 2025-03-17
 */
@Data
@Component
@ConfigurationProperties(prefix = "aliyun.oss")
public class OssConfig {

    /**
     * 主账号AccessKey ID
     */
    private String accessKeyId;

    /**
     * 主账号AccessKey Secret
     */
    private String accessKeySecret;

    /**
     * RAM角色的ARN
     */
    private String roleArn;

    /**
     * OSS endpoint
     */
    private String endpoint;

    /**
     * Bucket名称
     */
    private String bucketName;

    /**
     * 自定义域名（可选）
     */
    private String customDomain;

    /**
     * STS临时凭证有效期（秒）
     */
    private Long stsExpiration = 3600L;

    /**
     * 上传目录
     */
    private String uploadFolder = "blog";
}
