package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.service.OssStsService;
import com.rawchen.blog.vo.StsTokenVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * OSS文件上传控制器
 *
 * @author RawChen
 * @date 2025-03-17
 */
@Slf4j
@RestController
@RequestMapping("/oss")
public class FileUploadOssController {

    @Autowired
    private OssStsService ossStsService;

    /**
     * 获取STS临时凭证
     * 前端使用此凭证直接上传文件到OSS，不经过服务器
     */
    @GetMapping("/sts-token")
    public R getStsToken() {
        try {
            StsTokenVO stsToken = ossStsService.getStsToken();
            log.info("成功获取STS临时凭证, 过期时间: {}", stsToken.getExpiration());
            return R.ok(stsToken);
        } catch (Exception e) {
            log.error("获取STS临时凭证失败", e);
            return R.fail("获取上传凭证失败: " + e.getMessage());
        }
    }
}
