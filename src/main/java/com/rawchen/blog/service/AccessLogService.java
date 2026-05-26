package com.rawchen.blog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.entity.AccessLog;

/**
 * 访问日志服务接口
 *
 * @author RawChen
 */
public interface AccessLogService extends IService<AccessLog> {

    /**
     * 分页查询访问日志
     *
     * @param current   当前页
     * @param size      每页大小
     * @param operation 操作类型
     * @param ipAddress IP地址
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @return 分页结果
     */
    PageResult<AccessLog> getAccessLogList(Long current, Long size, String operation,
                                            String ipAddress, String startTime, String endTime);

    /**
     * 根据ID获取访问日志详情
     *
     * @param id 日志ID
     * @return 访问日志
     */
    AccessLog getAccessLogById(Long id);

    /**
     * 删除访问日志
     *
     * @param id 日志ID
     */
    void deleteAccessLog(Long id);

    /**
     * 批量删除访问日志
     *
     * @param ids 日志ID列表
     */
    void batchDeleteAccessLog(java.util.List<Long> ids);

    /**
     * 清空访问日志（保留指定天数）
     *
     * @param retainDays 保留天数
     */
    void clearAccessLog(Integer retainDays);

    /**
     * 记录访问日志
     *
     * @param accessLog 访问日志
     */
    void saveAccessLog(AccessLog accessLog);
}