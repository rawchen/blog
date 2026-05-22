package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 任务执行日志实体
 *
 * @author RawChen
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("task_execution_log")
public class TaskExecutionLog extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 任务ID
     */
    private Long jobId;

    /**
     * 任务名称
     */
    private String jobName;

    /**
     * 执行实例ID
     */
    private String executionId;

    /**
     * 开始时间
     */
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 执行状态 RUNNING/SUCCESS/FAILED/TIMEOUT
     */
    private String status;

    /**
     * 结果信息
     */
    private String resultMessage;

    /**
     * 错误信息
     */
    private String errorMessage;

    /**
     * 重试次数
     */
    private Integer retryCount;

    /**
     * 是否已发送告警
     */
    private Integer alertSent;
}
