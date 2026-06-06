package com.rawchen.blog.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.annotation.AccessLogAnnotation;
import com.rawchen.blog.annotation.OperationLogAnnotation;
import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.FriendLinkDTO;
import com.rawchen.blog.entity.FriendLink;
import com.rawchen.blog.enums.OperationType;
import com.rawchen.blog.enums.TargetType;
import com.rawchen.blog.service.FriendLinkService;
import com.rawchen.blog.service.OssStsService;
import com.rawchen.blog.service.OssUploadService;
import com.rawchen.blog.service.ConfigService;
import com.rawchen.blog.util.CaptchaUtil;
import com.rawchen.blog.vo.FriendLinkVO;
import com.rawchen.blog.vo.SiteConfigVO;
import com.rawchen.blog.vo.StsTokenVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.io.InputStream;
import java.net.URL;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 友链控制器
 *
 * @author RawChen
 */
@Api(tags = "友链管理")
@RestController
@RequestMapping("/api/friend-link")
public class FriendLinkController {

    @Autowired
    private FriendLinkService friendLinkService;

    @Autowired
    private OssStsService ossStsService;

    @Autowired
    private OssUploadService ossUploadService;

    @Autowired
    private ConfigService configService;

    @ApiOperation("获取验证码（前台）")
    @GetMapping("/captcha")
    public R<Map<String, Object>> getCaptcha() {
        String sessionId = "captcha_" + System.currentTimeMillis();
        Map<String, Object> captcha = CaptchaUtil.generateCaptcha(sessionId);
        return R.ok(captcha);
    }

    @ApiOperation("获取OSS上传凭证（前台，需验证码）")
    @GetMapping("/sts-token")
    public R<StsTokenVO> getStsTokenPublic(
            @RequestParam String captchaSessionId,
            @RequestParam Integer captchaAnswer) {
        // 验证验证码（不消耗，提交表单时才消耗）
        if (!CaptchaUtil.checkCaptcha(captchaSessionId, captchaAnswer)) {
            return R.fail("验证码错误或已过期");
        }
        // 获取STS凭证
        StsTokenVO token = ossStsService.getStsToken();
        return R.ok(token);
    }

    @ApiOperation("上传图片URL到OSS（前台，需验证码）")
    @PostMapping("/upload-image-url")
    public R<String> uploadImageUrl(
            @RequestParam String imageUrl,
            @RequestParam String captchaSessionId,
            @RequestParam Integer captchaAnswer) {
        // 验证验证码（不消耗，提交表单时才消耗）
        if (!CaptchaUtil.checkCaptcha(captchaSessionId, captchaAnswer)) {
            return R.fail("验证码错误或已过期");
        }
        try {
            // 下载图片
            URL url = new URL(imageUrl);
            String path = url.getPath();
            String ext = path.contains(".") ? path.substring(path.lastIndexOf(".") + 1) : "png";

            // 验证扩展名
            if (!ext.matches("(?i)(jpg|jpeg|png|gif|bmp|webp|svg)")) {
                ext = "png";
            }

            // 生成OSS对象键
            String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            String randomStr = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            String objectKey = "blog/" + datePath + "/" + randomStr + "." + ext;

            // 下载并上传
            try (InputStream inputStream = url.openStream()) {
                String ossUrl = ossUploadService.uploadStream(inputStream, objectKey);
                // 获取Logo样式配置并拼接
                SiteConfigVO siteConfig = configService.getSiteConfig();
                if (siteConfig.getOssStyleLogo() != null && !siteConfig.getOssStyleLogo().isEmpty()) {
                    ossUrl = ossUrl + siteConfig.getOssStyleLogo();
                }
                return R.ok(ossUrl);
            }
        } catch (Exception e) {
            return R.fail("图片下载失败: " + e.getMessage());
        }
    }

    @ApiOperation("获取友链列表（前台）")
    @GetMapping("/list")
    @AccessLogAnnotation("FRIENDS")
    public R<List<FriendLinkVO>> getFriendLinkList() {
        return R.ok(friendLinkService.getFriendLinkList());
    }

    @ApiOperation("申请友链（前台）")
    @PostMapping("/apply")
    public R<Long> applyFriendLink(@Valid @RequestBody FriendLinkDTO dto) {
        // 验证并消耗验证码
        if (dto.getCaptchaSessionId() == null || dto.getCaptchaAnswer() == null) {
            return R.fail("请完成人机验证");
        }
        if (!CaptchaUtil.validateCaptcha(dto.getCaptchaSessionId(), dto.getCaptchaAnswer())) {
            return R.fail("验证码错误或已过期");
        }
        return R.ok(friendLinkService.applyFriendLink(dto));
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("获取友链分页列表（后台）")
    @GetMapping("/admin/page")
    public R<Page<FriendLinkVO>> getFriendLinkPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return R.ok(friendLinkService.getFriendLinkPage(page, size, keyword));
    }

    @ApiOperation("根据ID获取友链")
    @GetMapping("/admin/{id}")
    public R<FriendLink> getFriendLinkById(@PathVariable Long id) {
        return R.ok(friendLinkService.getFriendLinkById(id));
    }

    @ApiOperation("添加友链")
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @OperationLogAnnotation(type = OperationType.CREATE, target = TargetType.FRIEND, description = "添加友链", recordDetail = true)
    public R<Long> addFriendLink(@Valid @RequestBody FriendLinkDTO dto) {
        return R.ok(friendLinkService.addFriendLink(dto));
    }

    @ApiOperation("更新友链")
    @PutMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @OperationLogAnnotation(type = OperationType.UPDATE, target = TargetType.FRIEND, description = "更新友链")
    public R<Void> updateFriendLink(@Valid @RequestBody FriendLinkDTO dto) {
        friendLinkService.updateFriendLink(dto);
        return R.ok();
    }

    @ApiOperation("删除友链")
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @OperationLogAnnotation(type = OperationType.DELETE, target = TargetType.FRIEND, description = "删除友链")
    public R<Void> deleteFriendLink(@PathVariable Long id) {
        friendLinkService.deleteFriendLink(id);
        return R.ok();
    }

    @ApiOperation("审核友链")
    @PutMapping("/admin/{id}/audit")
    @PreAuthorize("hasRole('ADMIN')")
    @OperationLogAnnotation(type = OperationType.AUDIT, target = TargetType.FRIEND, description = "审核友链")
    public R<Void> auditFriendLink(@PathVariable Long id, @RequestParam Integer status) {
        friendLinkService.auditFriendLink(id, status);
        return R.ok();
    }

    @ApiOperation("检测友链状态")
    @PostMapping("/admin/check/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> checkFriendLinkStatus(@PathVariable Long id) {
        friendLinkService.checkFriendLinkStatus(id);
        return R.ok();
    }
}
