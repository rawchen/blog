package com.rawchen.blog.service.impl;

import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.auth.sts.AssumeRoleRequest;
import com.aliyuncs.auth.sts.AssumeRoleResponse;
import com.aliyuncs.http.MethodType;
import com.aliyuncs.profile.DefaultProfile;
import com.rawchen.blog.config.OssConfig;
import com.rawchen.blog.service.OssStsService;
import com.rawchen.blog.vo.StsTokenVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 阿里云OSS STS服务实现
 *
 * @author RawChen
 * @date 2025-03-17
 */
@Slf4j
@Service
public class OssStsServiceImpl implements OssStsService {

    @Autowired
    private OssConfig ossConfig;

    @Override
    public StsTokenVO getStsToken() {
        try {
            // STS服务接入点，根据主账号地域选择
            String endpoint = "sts.cn-hangzhou.aliyuncs.com";

            // 发起STS请求所在的地域，建议保留默认值
            String regionId = "";

            // 添加endpoint
            DefaultProfile.addEndpoint(regionId, "Sts", endpoint);

            // 构造default profile
            DefaultProfile profile = DefaultProfile.getProfile(
                    regionId,
                    ossConfig.getAccessKeyId(),
                    ossConfig.getAccessKeySecret()
            );

            // 构造client
            DefaultAcsClient client = new DefaultAcsClient(profile);

            // 创建AssumeRole请求
            final AssumeRoleRequest request = new AssumeRoleRequest();
            request.setSysMethod(MethodType.POST);
            request.setRoleArn(ossConfig.getRoleArn());
            request.setRoleSessionName("oss-upload-session");
            request.setPolicy(buildPolicy());
            request.setDurationSeconds(ossConfig.getStsExpiration());

            // 获取临时凭证
            final AssumeRoleResponse response = client.getAcsResponse(request);

            log.info("获取STS临时凭证成功, Expiration: {}", response.getCredentials().getExpiration());

            // 从endpoint解析region，格式：oss-cn-hangzhou.aliyuncs.com
            // 返回完整格式的region: oss-cn-hangzhou
            String region = ossConfig.getEndpoint();
            if (region.contains(".aliyuncs.com")) {
                region = region.substring(0, region.indexOf(".aliyuncs.com"));
            }

            return StsTokenVO.builder()
                    .accessKeyId(response.getCredentials().getAccessKeyId())
                    .accessKeySecret(response.getCredentials().getAccessKeySecret())
                    .securityToken(response.getCredentials().getSecurityToken())
                    .expiration(response.getCredentials().getExpiration())
                    .endpoint(ossConfig.getEndpoint())
                    .bucketName(ossConfig.getBucketName())
                    .customDomain(ossConfig.getCustomDomain())
                    .uploadFolder(ossConfig.getUploadFolder())
                    .region(region)
                    .build();

        } catch (Exception e) {
            log.error("获取STS临时凭证失败: {}", e.getMessage(), e);
            throw new RuntimeException("获取STS临时凭证失败: " + e.getMessage());
        }
    }

    /**
     * 构建权限策略
     * 限制临时凭证只能上传指定Bucket
     */
    private String buildPolicy() {
        return String.format(
                "{" +
                        "  \"Version\": \"1\"," +
                        "  \"Statement\": [" +
                        "    {" +
                        "      \"Effect\": \"Allow\"," +
                        "      \"Action\": [" +
                        "        \"oss:PutObject\"," +
                        "        \"oss:GetObject\"" +
                        "      ]," +
                        "      \"Resource\": [" +
                        "        \"acs:oss:*:*:%s\"," +
                        "        \"acs:oss:*:*:%s/*\"" +
                        "      ]" +
                        "    }" +
                        "  ]" +
                        "}",
                ossConfig.getBucketName(),
                ossConfig.getBucketName()
        );
    }
}
