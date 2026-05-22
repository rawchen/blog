package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.dto.TaskJobDTO;
import com.rawchen.blog.entity.TaskExecutionLog;
import com.rawchen.blog.entity.TaskJob;
import com.rawchen.blog.exception.BusinessException;
import com.rawchen.blog.mapper.TaskExecutionLogMapper;
import com.rawchen.blog.mapper.TaskJobMapper;
import com.rawchen.blog.scheduler.DynamicJob;
import com.rawchen.blog.scheduler.JobHandlerFactory;
import com.rawchen.blog.service.TaskExecutionLogService;
import com.rawchen.blog.service.TaskJobService;
import com.rawchen.blog.vo.TaskExecutionLogVO;
import com.rawchen.blog.vo.TaskJobVO;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 任务管理服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class TaskJobServiceImpl implements TaskJobService {

    @Autowired
    private TaskJobMapper taskJobMapper;

    @Autowired
    private TaskExecutionLogMapper executionLogMapper;

    @Autowired
    private TaskExecutionLogService executionLogService;

    @Autowired
    private Scheduler scheduler;

    @Autowired
    private JobHandlerFactory jobHandlerFactory;

    @Override
    public Page<TaskJobVO> getJobPage(int page, int size, String jobName, String jobType, Integer enabled) {
        Page<TaskJob> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<TaskJob> wrapper = new LambdaQueryWrapper<>();

        if (jobName != null && !jobName.isEmpty()) {
            wrapper.like(TaskJob::getJobName, jobName);
        }
        if (jobType != null && !jobType.isEmpty()) {
            wrapper.eq(TaskJob::getJobType, jobType);
        }
        if (enabled != null) {
            wrapper.eq(TaskJob::getEnabled, enabled);
        }
        wrapper.orderByDesc(TaskJob::getCreateTime);

        Page<TaskJob> result = taskJobMapper.selectPage(pageParam, wrapper);

        Page<TaskJobVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::convertToVO).collect(Collectors.toList()));
        return voPage;
    }

    @Override
    public TaskJobVO getJobById(Long id) {
        TaskJob job = taskJobMapper.selectById(id);
        if (job == null) {
            throw new BusinessException("任务不存在");
        }
        return convertToVO(job);
    }

    @Override
    @Transactional
    public Long createJob(TaskJobDTO dto) {
        TaskJob job = new TaskJob();
        BeanUtils.copyProperties(dto, job);

        // 默认值
        if (job.getRetryCount() == null) {
            job.setRetryCount(0);
        }
        if (job.getTimeoutSeconds() == null) {
            job.setTimeoutSeconds(300);
        }
        if (job.getEnabled() == null) {
            job.setEnabled(1);
        }
        if (job.getVersion() == null) {
            job.setVersion(0);
        }

        // 校验
        validateJob(job);

        taskJobMapper.insert(job);
        log.info("创建任务成功: {}", job.getJobName());

        // 注册到Quartz
        if (job.getEnabled() == 1) {
            scheduleJob(job);
        }

        return job.getId();
    }

    @Override
    @Transactional
    public void updateJob(TaskJobDTO dto) {
        TaskJob existingJob = taskJobMapper.selectById(dto.getId());
        if (existingJob == null) {
            throw new BusinessException("任务不存在");
        }

        // 先从Quartz移除旧的调度
        unscheduleJob(existingJob);

        // 更新任务
        BeanUtils.copyProperties(dto, existingJob);
        validateJob(existingJob);

        taskJobMapper.updateById(existingJob);
        log.info("更新任务成功: {}", existingJob.getJobName());

        // 如果启用，重新注册到Quartz
        if (existingJob.getEnabled() == 1) {
            scheduleJob(existingJob);
        }
    }

    @Override
    @Transactional
    public void deleteJob(Long id) {
        TaskJob job = taskJobMapper.selectById(id);
        if (job == null) {
            throw new BusinessException("任务不存在");
        }

        // 从Quartz移除
        unscheduleJob(job);

        // 删除任务
        taskJobMapper.deleteById(id);
        log.info("删除任务成功: {}", id);
    }

    @Override
    public void triggerJob(Long id) {
        TaskJob job = taskJobMapper.selectById(id);
        if (job == null) {
            throw new BusinessException("任务不存在");
        }

        // 创建执行日志
        String executionId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        TaskExecutionLog executionLog = new TaskExecutionLog();
        executionLog.setJobId(job.getId());
        executionLog.setJobName(job.getJobName());
        executionLog.setExecutionId(executionId);
        executionLog.setStatus("RUNNING");
        executionLog.setStartTime(LocalDateTime.now());
        executionLog.setRetryCount(0);
        executionLog.setAlertSent(0);
        executionLogService.saveLog(executionLog);

        // 异步执行任务，立即返回
        String handlerName = job.getHandlerName();
        String handlerParams = job.getHandlerParams();
        Integer timeoutSeconds = job.getTimeoutSeconds();
        String alertEmail = job.getAlertEmail();

        new Thread(() -> {
            try {
                JobDataMap jobDataMap = new JobDataMap();
                jobDataMap.put("jobId", id);
                jobDataMap.put("jobName", job.getJobName());
                jobDataMap.put("handlerName", handlerName);
                jobDataMap.put("handlerParams", handlerParams);
                jobDataMap.put("timeoutSeconds", timeoutSeconds);
                jobDataMap.put("alertEmail", alertEmail);
                jobDataMap.put("executionId", executionId);

                String result = jobHandlerFactory.executeHandler(handlerName, jobDataMap);

                // 更新执行日志为成功
                TaskExecutionLog successLog = executionLogService.getByExecutionId(executionId);
                if (successLog != null) {
                    successLog.setStatus("SUCCESS");
                    successLog.setEndTime(LocalDateTime.now());
                    successLog.setResultMessage(result);
                    executionLogService.updateLog(successLog);
                }

                log.info("异步执行任务成功: {}", job.getJobName());
            } catch (Exception e) {
                log.error("异步执行任务失败: {}", job.getJobName(), e);
                TaskExecutionLog failedLog = executionLogService.getByExecutionId(executionId);
                if (failedLog != null) {
                    failedLog.setStatus("FAILED");
                    failedLog.setEndTime(LocalDateTime.now());
                    failedLog.setErrorMessage(e.getMessage());
                    executionLogService.updateLog(failedLog);
                }
            }

            // 更新最后执行时间
            taskJobMapper.update(null, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<TaskJob>()
                    .eq(TaskJob::getId, id)
                    .set(TaskJob::getLastRunTime, LocalDateTime.now()));
        }).start();

        log.info("触发任务已提交: {}", job.getJobName());
    }

    @Override
    @Transactional
    public void updateJobStatus(Long id, Integer enabled) {
        TaskJob job = taskJobMapper.selectById(id);
        if (job == null) {
            throw new BusinessException("任务不存在");
        }

        job.setEnabled(enabled);
        taskJobMapper.updateById(job);

        if (enabled == 1) {
            // 启用：注册到Quartz
            scheduleJob(job);
            log.info("启用任务: {}", job.getJobName());
        } else {
            // 禁用：从Quartz移除
            unscheduleJob(job);
            log.info("禁用任务: {}", job.getJobName());
        }
    }

    @Override
    public Page<TaskExecutionLogVO> getJobLogs(Long jobId, int page, int size) {
        Page<TaskExecutionLog> pageParam = new Page<>(page, size);
        Page<TaskExecutionLog> result = executionLogMapper.selectPage(pageParam,
                new LambdaQueryWrapper<TaskExecutionLog>()
                        .eq(TaskExecutionLog::getJobId, jobId)
                        .orderByDesc(TaskExecutionLog::getStartTime));

        Page<TaskExecutionLogVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::convertLogToVO).collect(Collectors.toList()));
        return voPage;
    }

    @Override
    public Page<TaskExecutionLogVO> getAllJobLogs(int page, int size, String jobName, String status, String startTime, String endTime) {
        Page<TaskExecutionLog> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<TaskExecutionLog> wrapper = new LambdaQueryWrapper<>();

        if (jobName != null && !jobName.isEmpty()) {
            wrapper.like(TaskExecutionLog::getJobName, jobName);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(TaskExecutionLog::getStatus, status);
        }
        if (startTime != null && !startTime.isEmpty()) {
            wrapper.ge(TaskExecutionLog::getStartTime, LocalDateTime.parse(startTime.replace(" ", "T")));
        }
        if (endTime != null && !endTime.isEmpty()) {
            wrapper.le(TaskExecutionLog::getEndTime, LocalDateTime.parse(endTime.replace(" ", "T")));
        }
        wrapper.orderByDesc(TaskExecutionLog::getStartTime);

        Page<TaskExecutionLog> result = executionLogMapper.selectPage(pageParam, wrapper);

        Page<TaskExecutionLogVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::convertLogToVO).collect(Collectors.toList()));
        return voPage;
    }

    /**
     * 注册任务到Quartz
     */
    private void scheduleJob(TaskJob job) {
        try {
            JobKey jobKey = new JobKey(job.getJobName());

            // 如果已存在，先删除
            if (scheduler.checkExists(jobKey)) {
                scheduler.deleteJob(jobKey);
            }

            JobDataMap jobDataMap = new JobDataMap();
            jobDataMap.put("jobId", job.getId());
            jobDataMap.put("jobName", job.getJobName());
            jobDataMap.put("handlerName", job.getHandlerName());
            jobDataMap.put("handlerParams", job.getHandlerParams());
            jobDataMap.put("timeoutSeconds", job.getTimeoutSeconds());
            jobDataMap.put("alertEmail", job.getAlertEmail());

            JobDetail jobDetail = JobBuilder.newJob(DynamicJob.class)
                    .withIdentity(jobKey)
                    .setJobData(jobDataMap)
                    .storeDurably()
                    .build();

            if ("CRON".equals(job.getJobType())) {
                // Cron表达式任务
                Trigger trigger = TriggerBuilder.newTrigger()
                        .withIdentity(job.getJobName() + "_trigger")
                        .withSchedule(CronScheduleBuilder.cronSchedule(job.getCronExpression())
                                .withMisfireHandlingInstructionDoNothing())
                        .forJob(jobDetail)
                        .build();

                scheduler.scheduleJob(jobDetail, trigger);
                log.info("注册Cron任务: {} -> {}", job.getJobName(), job.getCronExpression());
            } else if ("DELAYED_ONCE".equals(job.getJobType())) {
                // 一次性延迟任务
                Date executeDate = Date.from(job.getExecuteTime().atZone(ZoneId.systemDefault()).toInstant());
                Trigger trigger = TriggerBuilder.newTrigger()
                        .withIdentity(job.getJobName() + "_trigger")
                        .startAt(executeDate)
                        .forJob(jobDetail)
                        .build();

                scheduler.scheduleJob(jobDetail, trigger);
                log.info("注册一次性任务: {} -> {}", job.getJobName(), job.getExecuteTime());
            }
        } catch (SchedulerException e) {
            log.error("注册任务到Quartz失败: {}", job.getJobName(), e);
            throw new BusinessException("注册任务失败: " + e.getMessage());
        }
    }

    /**
     * 从Quartz移除任务
     */
    private void unscheduleJob(TaskJob job) {
        try {
            JobKey jobKey = new JobKey(job.getJobName());
            if (scheduler.checkExists(jobKey)) {
                scheduler.deleteJob(jobKey);
                log.info("从Quartz移除任务: {}", job.getJobName());
            }
        } catch (SchedulerException e) {
            log.error("从Quartz移除任务失败: {}", job.getJobName(), e);
        }
    }

    /**
     * 校验任务参数
     */
    private void validateJob(TaskJob job) {
        if ("CRON".equals(job.getJobType())) {
            if (job.getCronExpression() == null || job.getCronExpression().isEmpty()) {
                throw new BusinessException("Cron表达式不能为空");
            }
            // 校验Cron表达式有效性
            try {
                CronExpression.validateExpression(job.getCronExpression());
            } catch (Exception e) {
                throw new BusinessException("Cron表达式无效: " + e.getMessage());
            }
        } else if ("DELAYED_ONCE".equals(job.getJobType())) {
            if (job.getExecuteTime() == null) {
                throw new BusinessException("执行时间不能为空");
            }
            if (job.getExecuteTime().isBefore(LocalDateTime.now())) {
                throw new BusinessException("执行时间不能早于当前时间");
            }
        }

        // 校验处理器是否存在
        if (!jobHandlerFactory.hasHandler(job.getHandlerName())) {
            throw new BusinessException("处理器不存在: " + job.getHandlerName());
        }
    }

    private TaskJobVO convertToVO(TaskJob job) {
        TaskJobVO vo = new TaskJobVO();
        BeanUtils.copyProperties(job, vo);
        return vo;
    }

    private TaskExecutionLogVO convertLogToVO(TaskExecutionLog log) {
        TaskExecutionLogVO vo = new TaskExecutionLogVO();
        BeanUtils.copyProperties(log, vo);
        return vo;
    }
}