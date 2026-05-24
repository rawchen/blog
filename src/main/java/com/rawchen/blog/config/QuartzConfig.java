package com.rawchen.blog.config;

import com.rawchen.blog.entity.TaskJob;
import com.rawchen.blog.mapper.TaskJobMapper;
import com.rawchen.blog.scheduler.AutowiringJobFactory;
import com.rawchen.blog.scheduler.DynamicJob;
import com.rawchen.blog.scheduler.JobExecutionListener;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;

/**
 * Quartz配置类
 *
 * @author RawChen
 */
@Slf4j
@Configuration
public class QuartzConfig implements ApplicationRunner {

    @Autowired
    private JobExecutionListener jobExecutionListener;

    @Autowired
    private AutowiringJobFactory autowiringJobFactory;

    @Autowired
    private TaskJobMapper taskJobMapper;

    @Lazy
    @Autowired
    private Scheduler scheduler;

    @Bean
    public SchedulerFactoryBean schedulerFactoryBean() {
        SchedulerFactoryBean factory = new SchedulerFactoryBean();
        factory.setJobFactory(autowiringJobFactory);
        factory.setAutoStartup(true);
        factory.setStartupDelay(1);
        factory.setOverwriteExistingJobs(true);
        return factory;
    }

    @Bean
    public Scheduler scheduler(SchedulerFactoryBean factory) throws Exception {
        Scheduler scheduler = factory.getScheduler();
        scheduler.getListenerManager().addJobListener(jobExecutionListener);
        return scheduler;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("开始加载已启用的定时任务...");
        List<TaskJob> enabledJobs = taskJobMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<TaskJob>()
                        .eq(TaskJob::getEnabled, 1)
        );

        for (TaskJob job : enabledJobs) {
            try {
                JobKey jobKey = new JobKey(job.getJobName());

                if (scheduler.checkExists(jobKey)) {
                    scheduler.deleteJob(jobKey);
                }

                JobDataMap jobDataMap = new JobDataMap();
                jobDataMap.put("jobId", job.getId());
                jobDataMap.put("jobName", job.getJobName());
                jobDataMap.put("handlerName", job.getHandlerName());
                jobDataMap.put("handlerParams", job.getHandlerParams());
                jobDataMap.put("timeoutSeconds", job.getTimeoutSeconds());
                jobDataMap.put("alertEmail", job.getAlertEmail());

                JobDetail jobDetail = JobBuilder.newJob(DynamicJob.class)
                        .withIdentity(jobKey)
                        .setJobData(jobDataMap)
                        .storeDurably()
                        .build();

                if ("CRON".equals(job.getJobType())) {
                    Trigger trigger = TriggerBuilder.newTrigger()
                            .withIdentity(job.getJobName() + "_trigger")
                            .withSchedule(CronScheduleBuilder.cronSchedule(job.getCronExpression())
                                    .withMisfireHandlingInstructionDoNothing())
                            .forJob(jobDetail)
                            .build();
                    scheduler.scheduleJob(jobDetail, trigger);
                    log.info("加载定时任务: {} -> {}", job.getJobName(), job.getCronExpression());
                } else if ("DELAYED_ONCE".equals(job.getJobType()) && job.getExecuteTime() != null) {
                    Date executeDate = Date.from(job.getExecuteTime().atZone(ZoneId.systemDefault()).toInstant());
                    if (executeDate.after(new Date())) {
                        Trigger trigger = TriggerBuilder.newTrigger()
                                .withIdentity(job.getJobName() + "_trigger")
                                .startAt(executeDate)
                                .forJob(jobDetail)
                                .build();
                        scheduler.scheduleJob(jobDetail, trigger);
                        log.info("加载延迟任务: {} -> {}", job.getJobName(), job.getExecuteTime());
                    }
                }
            } catch (Exception e) {
                log.error("加载任务失败: {}", job.getJobName(), e);
            }
        }
        log.info("定时任务加载完成，共加载 {} 个任务", enabledJobs.size());
    }
}
