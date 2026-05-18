package com.rawchen.blog.annotation;

import java.lang.annotation.*;

/**
 * 访问日志注解
 * 用于标记需要记录访问日志的方法
 *
 * @author RawChen
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AccessLogAnnotation {

    /**
     * 操作类型: HOME/ARTICLE/PAGE/CATEGORY/TAG/MOMENTS/FRIENDS/ARCHIVE/SEARCH等
     */
    String value();
}