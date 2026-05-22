package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 任务定义VO
 *
 * @author RawChen
 */
@Data
public class TaskJobVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    private Long id;

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
     * 是否启用
     */
    private Integer enabled;

    /**
     * 版本号
     */
    private Integer version;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 最后执行时间
     */
    private LocalDateTime lastRunTime;
}
