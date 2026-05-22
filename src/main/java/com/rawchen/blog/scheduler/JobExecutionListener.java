package com.rawchen.blog.scheduler;

import com.rawchen.blog.entity.TaskExecutionLog;
import com.rawchen.blog.entity.TaskJob;
import com.rawchen.blog.mapper.TaskJobMapper;
import com.rawchen.blog.service.TaskExecutionLogService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Quartz任务执行监听器
 *
 * @author RawChen
 */
@Slf4j
@Component
public class JobExecutionListener implements JobListener {

    @Autowired
    private TaskExecutionLogService executionLogService;

    @Autowired
    private TaskJobMapper taskJobMapper;

    @Autowired
    private JobHandlerFactory jobHandlerFactory;

    @Override
    public String getName() {
        return "JobExecutionListener";
    }

    @Override
    public void jobToBeExecuted(JobExecutionContext context) {
        JobDataMap jobDataMap = context.getJobDetail().getJobDataMap();
        String executionId = (String) jobDataMap.get("executionId");

        if (executionId == null) {
            executionId = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            jobDataMap.put("executionId", executionId);
        }

        // 更新执行日志状态为运行中
        TaskExecutionLog executionLog = executionLogService.getByExecutionId(executionId);
        if (executionLog == null) {
            executionLog = new TaskExecutionLog();
            executionLog.setJobId(jobDataMap.getLong("jobId"));
            executionLog.setJobName(jobDataMap.getString("jobName"));
            executionLog.setExecutionId(executionId);
            executionLog.setStatus("RUNNING");
            executionLog.setStartTime(LocalDateTime.now());
            executionLog.setRetryCount(0);
            executionLog.setAlertSent(0);
            executionLogService.saveLog(executionLog);
        } else {
            executionLog.setStatus("RUNNING");
            executionLog.setStartTime(LocalDateTime.now());
            executionLogService.updateLog(executionLog);
        }

        log.info("任务开始执行: {} [{}]", jobDataMap.getString("jobName"), executionId);
    }

    @Override
    public void jobExecutionVetoed(JobExecutionContext context) {
        // 任务被否决
    }

    @Override
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException) {
        JobDataMap jobDataMap = context.getJobDetail().getJobDataMap();
        String executionId = jobDataMap.getString("executionId");

        TaskExecutionLog executionLog = executionLogService.getByExecutionId(executionId);
        if (executionLog == null) {
            return;
        }

        executionLog.setEndTime(LocalDateTime.now());

        if (jobException != null) {
            executionLog.setStatus("FAILED");
            executionLog.setErrorMessage(jobException.getMessage());
            log.error("任务执行失败: {} [{}]", executionLog.getJobName(), executionId, jobException);
        } else {
            executionLog.setStatus("SUCCESS");
            Object result = context.getResult();
            if (result != null) {
                executionLog.setResultMessage(result.toString());
            }
            log.info("任务执行成功: {} [{}]", executionLog.getJobName(), executionId);
        }

        executionLogService.updateLog(executionLog);

        // 更新任务最后执行时间
        Long jobId = jobDataMap.getLong("jobId");
        if (jobId != null) {
            TaskJob job = taskJobMapper.selectById(jobId);
            if (job != null) {
                job.setLastRunTime(LocalDateTime.now());
                taskJobMapper.updateById(job);
            }
        }
    }
}
