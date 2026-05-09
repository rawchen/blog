package com.rawchen.blog.service.impl;

import com.rawchen.blog.exception.BusinessException;
import com.rawchen.blog.service.UploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 文件上传服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class UploadServiceImpl implements UploadService {

    // 上传路径，使用工作目录（jar包所在目录）
    private String uploadPath;

    @Value("${upload.url-prefix:/uploads}")
    private String urlPrefix;

    @Value("${upload.path:uploads}")
    public void setUploadPath(String path) {
        // 使用工作目录作为基础路径
        this.uploadPath = System.getProperty("user.dir") + "/" + path;
    }

    // 允许的图片类型
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"
    );

    // 允许的文件类型
    private static final List<String> ALLOWED_FILE_TYPES = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            "txt", "zip", "rar", "7z", "mp3", "mp4", "avi"
    );

    @Override
    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("请选择要上传的图片");
        }

        // 获取文件扩展名
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);

        if (extension == null || !ALLOWED_IMAGE_TYPES.contains(extension.toLowerCase())) {
            throw new BusinessException("不支持的图片格式，仅支持: " + String.join(", ", ALLOWED_IMAGE_TYPES));
        }

        return saveFile(file, "images", extension);
    }

    @Override
    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("请选择要上传的文件");
        }

        // 获取文件扩展名
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);

        if (extension == null || !ALLOWED_FILE_TYPES.contains(extension.toLowerCase())) {
            throw new BusinessException("不支持的文件格式");
        }

        return saveFile(file, "files", extension);
    }

    @Override
    public boolean deleteFile(String filename) {
        if (filename == null || filename.isEmpty()) {
            return false;
        }

        // 移除URL前缀
        if (filename.startsWith(urlPrefix)) {
            filename = filename.substring(urlPrefix.length());
        }

        File file = new File(uploadPath + filename);
        if (file.exists() && file.isFile()) {
            boolean deleted = file.delete();
            if (deleted) {
                log.info("删除文件成功: {}", filename);
            }
            return deleted;
        }
        return false;
    }

    @Override
    public String getFileUrl(String filename) {
        return urlPrefix + "/" + filename;
    }

    /**
     * 保存文件
     */
    private String saveFile(MultipartFile file, String category, String extension) {
        try {
            // 生成日期目录
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));

            // 生成新文件名
            String newFilename = UUID.randomUUID().toString().replace("-", "") + "." + extension;

            // 构建完整路径
            String relativePath = "/" + category + "/" + datePath;
            String fullPath = uploadPath + relativePath;

            // 创建目录
            File dir = new File(fullPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // 保存文件
            File destFile = new File(fullPath + "/" + newFilename);
            file.transferTo(destFile);

            log.info("上传文件成功: {}", destFile.getAbsolutePath());

            // 返回访问URL
            return urlPrefix + relativePath + "/" + newFilename;

        } catch (IOException e) {
            log.error("上传文件失败: {}", e.getMessage(), e);
            throw new BusinessException("上传文件失败: " + e.getMessage());
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return null;
        }
        return filename.substring(lastDotIndex + 1);
    }
}
