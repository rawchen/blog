package com.rawchen.blog.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传服务接口
 *
 * @author RawChen
 */
public interface UploadService {

    /**
     * 上传图片
     *
     * @param file 图片文件
     * @return 访问URL
     */
    String uploadImage(MultipartFile file);

    /**
     * 上传文件
     *
     * @param file 文件
     * @return 访问URL
     */
    String uploadFile(MultipartFile file);

    /**
     * 删除文件
     *
     * @param filename 文件名
     * @return 是否成功
     */
    boolean deleteFile(String filename);

    /**
     * 获取文件访问URL
     *
     * @param filename 文件名
     * @return 访问URL
     */
    String getFileUrl(String filename);
}
