package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.service.UploadService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传控制器
 *
 * @author RawChen
 */
@Api(tags = "文件上传")
@RestController
@RequestMapping("/upload")
public class UploadController {

    @Autowired
    private UploadService uploadService;

    @ApiOperation("上传图片")
    @PostMapping("/image")
    @PreAuthorize("hasAuthority('content:article:add')")
    public R<String> uploadImage(@RequestParam("file") MultipartFile file) {
        return R.ok(uploadService.uploadImage(file));
    }

    @ApiOperation("上传文件")
    @PostMapping("/file")
    @PreAuthorize("hasAuthority('content:article:add')")
    public R<String> uploadFile(@RequestParam("file") MultipartFile file) {
        return R.ok(uploadService.uploadFile(file));
    }

    @ApiOperation("删除文件")
    @DeleteMapping("/{filename}")
    @PreAuthorize("hasAuthority('content:article:delete')")
    public R<Void> deleteFile(@PathVariable String filename) {
        uploadService.deleteFile(filename);
        return R.ok();
    }
}
