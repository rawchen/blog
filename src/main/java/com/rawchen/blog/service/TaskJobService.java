package com.rawchen.blog.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.rawchen.blog.dto.TaskJobDTO;
import com.rawchen.blog.entity.TaskJob;
import com.rawchen.blog.vo.TaskExecutionLogVO;
import com.rawchen.blog.vo.TaskJobVO;

/**
 * 任务管理服务接口
 *
 * @author RawChen
 */
public interface TaskJobService extends IService<TaskJob> {

    /**
     * 分页查询任务列表
     */
    Page<TaskJobVO> getJobPage(int page, int size, String jobName, String jobType, Integer enabled);

    /**
     * 根据ID获取任务
     */
    TaskJobVO getJobById(Long id);

    /**
     * 创建任务
     */
    Long createJob(TaskJobDTO dto);

    /**
     * 更新任务
     */
    void updateJob(TaskJobDTO dto);

    /**
     * 删除任务
     */
    void deleteJob(Long id);

    /**
     * 手动触发任务
     */
    void triggerJob(Long id);

    /**
     * 启用/禁用任务
     */
    void updateJobStatus(Long id, Integer enabled);

    /**
     * 获取执行日志
     */
    Page<TaskExecutionLogVO> getJobLogs(Long jobId, int page, int size);

    /**
     * 获取所有任务执行日志
     */
    Page<TaskExecutionLogVO> getAllJobLogs(int page, int size, String jobName, String status, String startTime, String endTime);
}
