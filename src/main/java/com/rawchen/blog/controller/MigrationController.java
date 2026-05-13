package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.*;
import com.rawchen.blog.service.MigrationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * 数据迁移控制器
 *
 * @author RawChen
 */
@Api(tags = "数据迁移")
@RestController
@RequestMapping("/api/migration")
public class MigrationController {

    @Autowired
    private MigrationService migrationService;

    @ApiOperation("获取数据库列表")
    @PostMapping("/admin/databases")
    public R<List<String>> getDatabases(@Valid @RequestBody MigrationConnectDTO dto) {
        return R.ok(migrationService.getDatabases(dto));
    }

    @ApiOperation("测试数据库连接")
    @PostMapping("/admin/connect")
    public R<MigrationConnectResponseDTO> testConnection(@Valid @RequestBody MigrationConnectDTO dto) {
        return R.ok(migrationService.testConnection(dto));
    }

    @ApiOperation("获取已迁移数据统计")
    @GetMapping("/admin/stats")
    public R<MigrationStatsDTO> getMigrationStats() {
        return R.ok(migrationService.getMigrationStats());
    }

    @ApiOperation("开始迁移")
    @PostMapping("/admin/start")
    public R<Void> startMigration(@Valid @RequestBody MigrationConnectDTO dto,
                                   @AuthenticationPrincipal UserDetails userDetails) {
        // 获取当前用户ID，这里简化处理
        Long currentUserId = 1L; // 默认使用ID为1的管理员
        migrationService.startMigration(dto, currentUserId);
        return R.ok();
    }

    @ApiOperation("获取迁移进度")
    @GetMapping("/admin/progress")
    public R<MigrationProgressDTO> getProgress() {
        return R.ok(migrationService.getProgress());
    }
}
