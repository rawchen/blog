package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 任务定义实体
 *
 * @author RawChen
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("task_job")
public class TaskJob extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 任务名称
     */
    private String jobName;

    /**
     * 任务类型 CRON/DELAYED_ONCE
     */
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
     * 是否启用 0禁用 1启用
     */
    private Integer enabled;

    /**
     * 版本号(乐观锁)
     */
    @Version
    private Integer version;

    /**
     * 最后执行时间
     */
    private LocalDateTime lastRunTime;
}
