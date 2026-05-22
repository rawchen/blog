package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.entity.TaskExecutionLog;
import com.rawchen.blog.mapper.TaskExecutionLogMapper;
import com.rawchen.blog.service.TaskExecutionLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 任务执行日志服务实现
 *
 * @author RawChen
 */
@Service
public class TaskExecutionLogServiceImpl implements TaskExecutionLogService {

    @Autowired
    private TaskExecutionLogMapper executionLogMapper;

    @Override
    public TaskExecutionLog saveLog(TaskExecutionLog log) {
        executionLogMapper.insert(log);
        return log;
    }

    @Override
    public void updateLog(TaskExecutionLog log) {
        executionLogMapper.updateById(log);
    }

    @Override
    public TaskExecutionLog getByExecutionId(String executionId) {
        return executionLogMapper.selectOne(
                new LambdaQueryWrapper<TaskExecutionLog>()
                        .eq(TaskExecutionLog::getExecutionId, executionId)
                        .last("LIMIT 1")
        );
    }
}
