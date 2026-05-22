package com.rawchen.blog.service;

import com.rawchen.blog.entity.TaskExecutionLog;

/**
 * 任务执行日志服务接口
 *
 * @author RawChen
 */
public interface TaskExecutionLogService {

    /**
     * 保存执行日志
     */
    TaskExecutionLog saveLog(TaskExecutionLog log);

    /**
     * 更新执行日志
     */
    void updateLog(TaskExecutionLog log);

    /**
     * 根据执行ID获取日志
     */
    TaskExecutionLog getByExecutionId(String executionId);
}
