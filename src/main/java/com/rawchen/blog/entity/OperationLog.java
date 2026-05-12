package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 操作日志实体
 *
 * @author RawChen
 */
@Data
@TableName("blog_operation_log")
public class OperationLog implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 操作类型: CREATE/UPDATE/DELETE等
     */
    private String operationType;

    /**
     * 目标类型: ARTICLE/CATEGORY/TAG等
     */
    private String targetType;

    /**
     * 目标ID
     */
    private Long targetId;

    /**
     * 操作详情JSON
     */
    private String detail;

    /**
     * IP地址
     */
    private String ipAddress;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}