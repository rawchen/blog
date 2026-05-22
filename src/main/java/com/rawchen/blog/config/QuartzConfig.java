package com.rawchen.blog.config;

import com.rawchen.blog.scheduler.AutowiringJobFactory;
import com.rawchen.blog.scheduler.JobExecutionListener;
import org.quartz.Scheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;

/**
 * Quartz配置类
 *
 * @author RawChen
 */
@Configuration
public class QuartzConfig {

    @Autowired
    private JobExecutionListener jobExecutionListener;

    @Autowired
    private AutowiringJobFactory autowiringJobFactory;

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
}
