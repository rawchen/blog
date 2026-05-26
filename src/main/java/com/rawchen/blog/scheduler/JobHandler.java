package com.rawchen.blog.scheduler;

import org.quartz.JobDataMap;

import java.util.Collections;
import java.util.List;

/**
 * 任务处理器接口
 *
 * @author RawChen
 */
public interface JobHandler {

    /**
     * 执行任务
     *
     * @param context 任务上下文数据
     * @return 执行结果消息
     */
    String execute(JobDataMap context);

    /**
     * 获取处理器名称
     */
    String getName();

    /**
     * 获取处理器描述
     */
    default String getDescription() {
        return "";
    }

    /**
     * 获取处理器参数定义
     */
    default List<HandlerParam> getParams() {
        return Collections.emptyList();
    }
}
