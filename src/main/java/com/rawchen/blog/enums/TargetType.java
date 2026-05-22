package com.rawchen.blog.enums;

/**
 * 目标类型枚举
 *
 * @author RawChen
 */
public enum TargetType {

    /**
     * 文章
     */
    ARTICLE("文章"),

    /**
     * 独立页面
     */
    PAGE("独立页面"),

    /**
     * 分类
     */
    CATEGORY("分类"),

    /**
     * 标签
     */
    TAG("标签"),

    /**
     * 评论
     */
    COMMENT("评论"),

    /**
     * 友链
     */
    FRIEND("友链"),

    /**
     * 任务
     */
    TASK("任务"),

    /**
     * 用户
     */
    USER("用户"),

    /**
     * 动态
     */
    MOMENT("动态"),

    /**
     * 配置
     */
    CONFIG("配置"),

    /**
     * 其他
     */
    OTHER("其他");

    private final String description;

    TargetType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}