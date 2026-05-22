package com.rawchen.blog.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * 动态任务执行Job
 *
 * @author RawChen
 */
@Slf4j
public class DynamicJob implements Job {

    @Autowired
    private JobHandlerFactory jobHandlerFactory;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobDataMap jobDataMap = context.getJobDetail().getJobDataMap();
        String jobName = jobDataMap.getString("jobName");
        String handlerName = jobDataMap.getString("handlerName");

        log.info("开始执行任务: {}, 处理器: {}", jobName, handlerName);

        try {
            if (jobHandlerFactory == null) {
                throw new JobExecutionException("无法获取处理器工厂");
            }

            // 执行处理器
            String result = jobHandlerFactory.executeHandler(handlerName, jobDataMap);
            context.setResult(result);

            log.info("任务执行完成: {}, 结果: {}", jobName, result);
        } catch (Exception e) {
            log.error("执行任务失败: {}", jobName, e);
            throw new JobExecutionException(e);
        }
    }
}
