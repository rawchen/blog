package com.rawchen.blog.controller;

import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.R;
import com.rawchen.blog.entity.AccessLog;
import com.rawchen.blog.entity.OperationLog;
import com.rawchen.blog.service.AccessLogService;
import com.rawchen.blog.service.OperationLogService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 日志管理控制器
 *
 * @author RawChen
 */
@Api(tags = "日志管理")
@RestController
@RequestMapping("/api/log")
public class LogController {

    @Autowired
    private OperationLogService operationLogService;

    @Autowired
    private AccessLogService accessLogService;

    // ========== 登录日志 ==========

    @ApiOperation("分页查询登录日志")
    @GetMapping("/login/list")
    public R<PageResult<OperationLog>> getLoginLogList(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return R.ok(operationLogService.getLoginLogList(current, size, username, startTime, endTime));
    }

    @ApiOperation("获取登录日志详情")
    @GetMapping("/login/{id}")
    public R<OperationLog> getLoginLogById(@PathVariable Long id) {
        return R.ok(operationLogService.getOperationLogById(id));
    }

    @ApiOperation("删除登录日志")
    @DeleteMapping("/login/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> deleteLoginLog(@PathVariable Long id) {
        operationLogService.deleteOperationLog(id);
        return R.ok();
    }

    @ApiOperation("批量删除登录日志")
    @PostMapping("/login/batch-delete")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> batchDeleteLoginLog(@RequestBody List<Long> ids) {
        operationLogService.batchDeleteOperationLog(ids);
        return R.ok();
    }

    // ========== 操作日志 ==========

    @ApiOperation("分页查询操作日志")
    @GetMapping("/operation/list")
    public R<PageResult<OperationLog>> getOperationLogList(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return R.ok(operationLogService.getOperationLogList(current, size, operationType, targetType, username, startTime, endTime));
    }

    @ApiOperation("获取操作日志详情")
    @GetMapping("/operation/{id}")
    public R<OperationLog> getOperationLogById(@PathVariable Long id) {
        return R.ok(operationLogService.getOperationLogById(id));
    }

    @ApiOperation("删除操作日志")
    @DeleteMapping("/operation/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> deleteOperationLog(@PathVariable Long id) {
        operationLogService.deleteOperationLog(id);
        return R.ok();
    }

    @ApiOperation("批量删除操作日志")
    @PostMapping("/operation/batch-delete")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> batchDeleteOperationLog(@RequestBody List<Long> ids) {
        operationLogService.batchDeleteOperationLog(ids);
        return R.ok();
    }

    // ========== 访问日志 ==========

    @ApiOperation("分页查询访问日志")
    @GetMapping("/access/list")
    public R<PageResult<AccessLog>> getAccessLogList(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String operation,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return R.ok(accessLogService.getAccessLogList(current, size, operation, ipAddress, startTime, endTime));
    }

    @ApiOperation("获取访问日志详情")
    @GetMapping("/access/{id}")
    public R<AccessLog> getAccessLogById(@PathVariable Long id) {
        return R.ok(accessLogService.getAccessLogById(id));
    }

    @ApiOperation("删除访问日志")
    @DeleteMapping("/access/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> deleteAccessLog(@PathVariable Long id) {
        accessLogService.deleteAccessLog(id);
        return R.ok();
    }

    @ApiOperation("批量删除访问日志")
    @PostMapping("/access/batch-delete")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> batchDeleteAccessLog(@RequestBody List<Long> ids) {
        accessLogService.batchDeleteAccessLog(ids);
        return R.ok();
    }

    // ========== 日志清理 ==========

    @ApiOperation("清空操作日志")
    @DeleteMapping("/operation/clear")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> clearOperationLog(@RequestParam(defaultValue = "30") Integer retainDays) {
        operationLogService.clearOperationLog(retainDays);
        return R.ok();
    }

    @ApiOperation("清空访问日志")
    @DeleteMapping("/access/clear")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> clearAccessLog(@RequestParam(defaultValue = "30") Integer retainDays) {
        accessLogService.clearAccessLog(retainDays);
        return R.ok();
    }
}