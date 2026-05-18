package com.rawchen.blog.annotation;

import com.rawchen.blog.enums.OperationType;
import com.rawchen.blog.enums.TargetType;

import java.lang.annotation.*;

/**
 * 操作日志注解
 * 用于标记需要记录操作日志的方法
 *
 * @author RawChen
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLogAnnotation {

    /**
     * 操作类型
     */
    OperationType type();

    /**
     * 目标类型
     */
    TargetType target();

    /**
     * 操作描述（可选）
     */
    String description() default "";

    /**
     * 是否记录操作详情
     */
    boolean recordDetail() default false;
}