package com.rawchen.blog.service;

import java.io.InputStream;

/**
 * OSS直接上传服务接口
 *
 * @author RawChen
 */
public interface OssUploadService {

    /**
     * 直接上传流到OSS
     *
     * @param inputStream 输入流
     * @param objectKey 对象键
     * @return 访问URL
     */
    String uploadStream(InputStream inputStream, String objectKey);
}
