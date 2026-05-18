package com.rawchen.blog.enums;

/**
 * 操作类型枚举
 *
 * @author RawChen
 */
public enum OperationType {

    /**
     * 登录
     */
    LOGIN("登录"),

    /**
     * 登出
     */
    LOGOUT("登出"),

    /**
     * 创建
     */
    CREATE("创建"),

    /**
     * 更新
     */
    UPDATE("更新"),

    /**
     * 删除
     */
    DELETE("删除"),

    /**
     * 审核
     */
    AUDIT("审核"),

    /**
     * 重置
     */
    RESET("重置"),

    /**
     * 其他
     */
    OTHER("其他");

    private final String description;

    OperationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}