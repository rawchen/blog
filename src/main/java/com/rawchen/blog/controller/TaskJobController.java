package com.rawchen.blog.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.annotation.OperationLogAnnotation;
import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.TaskJobDTO;
import com.rawchen.blog.enums.OperationType;
import com.rawchen.blog.enums.TargetType;
import com.rawchen.blog.scheduler.JobHandlerFactory;
import com.rawchen.blog.service.TaskJobService;
import com.rawchen.blog.vo.TaskExecutionLogVO;
import com.rawchen.blog.vo.TaskJobVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

/**
 * 任务管理控制器
 *
 * @author RawChen
 */
@Api(tags = "任务管理")
@RestController
@RequestMapping("/api/admin/task")
public class TaskJobController {

    @Autowired
    private TaskJobService taskJobService;

    @Autowired
    private JobHandlerFactory jobHandlerFactory;

    @ApiOperation("分页查询任务列表")
    @GetMapping("/page")
    public R<Page<TaskJobVO>> getJobPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String jobName,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) Integer enabled) {
        return R.ok(taskJobService.getJobPage(page, size, jobName, jobType, enabled));
    }

    @ApiOperation("获取任务详情")
    @GetMapping("/{id}")
    public R<TaskJobVO> getJobById(@PathVariable Long id) {
        return R.ok(taskJobService.getJobById(id));
    }

    @ApiOperation("创建任务")
    @PostMapping
    @OperationLogAnnotation(type = OperationType.CREATE, target = TargetType.TASK, description = "创建调度任务")
    public R<Long> createJob(@Valid @RequestBody TaskJobDTO dto) {
        return R.ok(taskJobService.createJob(dto));
    }

    @ApiOperation("更新任务")
    @PutMapping
    @OperationLogAnnotation(type = OperationType.UPDATE, target = TargetType.TASK, description = "更新调度任务")
    public R<Void> updateJob(@Valid @RequestBody TaskJobDTO dto) {
        taskJobService.updateJob(dto);
        return R.ok();
    }

    @ApiOperation("删除任务")
    @DeleteMapping("/{id}")
    @OperationLogAnnotation(type = OperationType.DELETE, target = TargetType.TASK, description = "删除调度任务")
    public R<Void> deleteJob(@PathVariable Long id) {
        taskJobService.deleteJob(id);
        return R.ok();
    }

    @ApiOperation("手动触发任务")
    @PostMapping("/trigger/{id}")
    public R<Void> triggerJob(@PathVariable Long id) {
        taskJobService.triggerJob(id);
        return R.ok();
    }

    @ApiOperation("启用/禁用任务")
    @PutMapping("/{id}/status")
    @OperationLogAnnotation(type = OperationType.UPDATE, target = TargetType.TASK, description = "更新任务状态")
    public R<Void> updateJobStatus(@PathVariable Long id, @RequestParam Integer enabled) {
        taskJobService.updateJobStatus(id, enabled);
        return R.ok();
    }

    @ApiOperation("获取执行日志")
    @GetMapping("/{id}/logs")
    public R<Page<TaskExecutionLogVO>> getJobLogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return R.ok(taskJobService.getJobLogs(id, page, size));
    }

    @ApiOperation("获取所有任务执行日志")
    @GetMapping("/logs")
    public R<Page<TaskExecutionLogVO>> getAllJobLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String jobName,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return R.ok(taskJobService.getAllJobLogs(page, size, jobName, status, startTime, endTime));
    }

    @ApiOperation("获取所有处理器")
    @GetMapping("/handlers")
    public R<Map<String, String>> getHandlers() {
        return R.ok(jobHandlerFactory.getAllHandlers());
    }
}
