package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.TaskExecutionLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务执行日志Mapper
 *
 * @author RawChen
 */
@Mapper
public interface TaskExecutionLogMapper extends BaseMapper<TaskExecutionLog> {
}
