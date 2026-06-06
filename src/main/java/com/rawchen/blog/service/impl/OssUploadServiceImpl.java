package com.rawchen.blog.service.impl;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.rawchen.blog.config.OssConfig;
import com.rawchen.blog.service.OssUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.InputStream;

/**
 * OSS直接上传服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class OssUploadServiceImpl implements OssUploadService {

    @Autowired
    private OssConfig ossConfig;

    private OSS ossClient;

    @PostConstruct
    public void init() {
        // 从endpoint解析region
        String region = ossConfig.getEndpoint();
        if (region.contains(".aliyuncs.com")) {
            region = region.substring(0, region.indexOf(".aliyuncs.com"));
        }
        ossClient = new OSSClientBuilder().build(region + ".aliyuncs.com",
                ossConfig.getAccessKeyId(), ossConfig.getAccessKeySecret());
    }

    @PreDestroy
    public void destroy() {
        if (ossClient != null) {
            ossClient.shutdown();
        }
    }

    @Override
    public String uploadStream(InputStream inputStream, String objectKey) {
        try {
            ossClient.putObject(ossConfig.getBucketName(), objectKey, inputStream);

            // 返回文件URL
            if (ossConfig.getCustomDomain() != null && !ossConfig.getCustomDomain().isEmpty()) {
                return "https://" + ossConfig.getCustomDomain() + "/" + objectKey;
            } else {
                return "https://" + ossConfig.getBucketName() + "." + ossConfig.getEndpoint() + "/" + objectKey;
            }
        } catch (Exception e) {
            log.error("上传文件到OSS失败: {}", e.getMessage(), e);
            throw new RuntimeException("上传文件失败: " + e.getMessage());
        }
    }
}
