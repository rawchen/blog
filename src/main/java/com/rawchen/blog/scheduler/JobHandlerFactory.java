package com.rawchen.blog.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.quartz.JobDataMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 任务处理器工厂
 *
 * @author RawChen
 */
@Slf4j
@Component
public class JobHandlerFactory {

    @Autowired
    private List<JobHandler> handlers;

    private final Map<String, JobHandler> handlerMap = new HashMap<>();

    @PostConstruct
    public void init() {
        for (JobHandler handler : handlers) {
            handlerMap.put(handler.getName(), handler);
            log.info("注册任务处理器: {} - {}", handler.getName(), handler.getDescription());
        }
    }

    /**
     * 执行处理器
     */
    public String executeHandler(String handlerName, JobDataMap context) {
        JobHandler handler = handlerMap.get(handlerName);
        if (handler == null) {
            throw new RuntimeException("处理器不存在: " + handlerName);
        }
        return handler.execute(context);
    }

    /**
     * 检查处理器是否存在
     */
    public boolean hasHandler(String handlerName) {
        return handlerMap.containsKey(handlerName);
    }

    /**
     * 获取所有处理器名称
     */
    public Map<String, String> getAllHandlers() {
        Map<String, String> result = new HashMap<>();
        for (Map.Entry<String, JobHandler> entry : handlerMap.entrySet()) {
            result.put(entry.getKey(), entry.getValue().getDescription());
        }
        return result;
    }
}
