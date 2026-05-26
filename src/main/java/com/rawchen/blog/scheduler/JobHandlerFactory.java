package com.rawchen.blog.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.quartz.JobDataMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    /**
     * 获取处理器详情（包含参数定义）
     */
    public HandlerDetail getHandlerDetail(String handlerName) {
        JobHandler handler = handlerMap.get(handlerName);
        if (handler == null) {
            return null;
        }
        return new HandlerDetail(
                handler.getName(),
                handler.getDescription(),
                handler.getParams()
        );
    }

    /**
     * 获取所有处理器详情列表
     */
    public List<HandlerDetail> getAllHandlerDetails() {
        return handlerMap.values().stream()
                .map(h -> new HandlerDetail(h.getName(), h.getDescription(), h.getParams()))
                .collect(Collectors.toList());
    }

    /**
     * 处理器详情
     */
    public static class HandlerDetail {
        private final String name;
        private final String description;
        private final List<HandlerParam> params;

        public HandlerDetail(String name, String description, List<HandlerParam> params) {
            this.name = name;
            this.description = description;
            this.params = params;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public List<HandlerParam> getParams() {
            return params;
        }
    }
}
