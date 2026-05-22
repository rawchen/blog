package com.rawchen.blog.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 任务定义DTO
 *
 * @author RawChen
 */
@Data
public class TaskJobDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    private Long id;

    /**
     * 任务名称
     */
    @NotBlank(message = "任务名称不能为空")
    private String jobName;

    /**
     * 任务类型 CRON/DELAYED_ONCE
     */
    @NotBlank(message = "任务类型不能为空")
    private String jobType;

    /**
     * Cron表达式
     */
    private String cronExpression;

    /**
     * 一次性任务执行时间
     */
    private LocalDateTime executeTime;

    /**
     * 处理器名称
     */
    @NotBlank(message = "处理器名称不能为空")
    private String handlerName;

    /**
     * 处理器参数(JSON)
     */
    private String handlerParams;

    /**
     * 重试次数
     */
    private Integer retryCount;

    /**
     * 超时时间(秒)
     */
    private Integer timeoutSeconds;

    /**
     * 异常通知邮箱
     */
    private String alertEmail;

    /**
     * 是否启用
     */
    private Integer enabled;
}
