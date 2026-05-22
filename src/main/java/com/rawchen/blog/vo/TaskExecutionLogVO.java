package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 任务执行日志VO
 *
 * @author RawChen
 */
@Data
public class TaskExecutionLogVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    private Long id;

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

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}
