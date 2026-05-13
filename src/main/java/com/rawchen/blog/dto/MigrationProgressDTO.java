package com.rawchen.blog.dto;

import lombok.Data;

import java.io.Serializable;

/**
 * 迁移进度响应DTO
 *
 * @author RawChen
 */
@Data
public class MigrationProgressDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 是否正在迁移
     */
    private Boolean migrating;

    /**
     * 当前步骤
     */
    private String currentStep;

    /**
     * 进度百分比 (0-100)
     */
    private Integer progress;

    /**
     * 总数
     */
    private Integer total;

    /**
     * 已处理数
     */
    private Integer processed;

    /**
     * 是否完成
     */
    private Boolean completed;

    /**
     * 错误消息
     */
    private String errorMessage;

    public MigrationProgressDTO() {
        this.migrating = false;
        this.progress = 0;
        this.total = 0;
        this.processed = 0;
        this.completed = false;
    }
}
