package com.rawchen.blog.vo;

import lombok.Builder;
import lombok.Data;

/**
 * STS临时凭证VO
 *
 * @author RawChen
 * @date 2025-03-17
 */
@Data
@Builder
public class StsTokenVO {

    /**
     * 临时AccessKey ID
     */
    private String accessKeyId;

    /**
     * 临时AccessKey Secret
     */
    private String accessKeySecret;

    /**
     * 安全令牌
     */
    private String securityToken;

    /**
     * 过期时间
     */
    private String expiration;

    /**
     * OSS endpoint
     */
    private String endpoint;

    /**
     * Bucket名称
     */
    private String bucketName;

    /**
     * 自定义域名
     */
    private String customDomain;

    /**
     * 上传目录
     */
    private String uploadFolder;

    /**
     * 区域
     */
    private String region;
}
