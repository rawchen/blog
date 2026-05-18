package com.rawchen.blog.service;

import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.entity.OperationLog;

/**
 * 操作日志服务接口
 *
 * @author RawChen
 */
public interface OperationLogService {

    /**
     * 分页查询操作日志
     *
     * @param current    当前页
     * @param size       每页大小
     * @param operationType 操作类型
     * @param targetType 目标类型
     * @param username   用户名
     * @param startTime  开始时间
     * @param endTime    结束时间
     * @return 分页结果
     */
    PageResult<OperationLog> getOperationLogList(Long current, Long size, String operationType,
                                                  String targetType, String username,
                                                  String startTime, String endTime);

    /**
     * 分页查询登录日志
     *
     * @param current   当前页
     * @param size      每页大小
     * @param username  用户名
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @return 分页结果
     */
    PageResult<OperationLog> getLoginLogList(Long current, Long size, String username,
                                              String startTime, String endTime);

    /**
     * 根据ID获取操作日志详情
     *
     * @param id 日志ID
     * @return 操作日志
     */
    OperationLog getOperationLogById(Long id);

    /**
     * 删除操作日志
     *
     * @param id 日志ID
     */
    void deleteOperationLog(Long id);

    /**
     * 批量删除操作日志
     *
     * @param ids 日志ID列表
     */
    void batchDeleteOperationLog(java.util.List<Long> ids);

    /**
     * 清空操作日志（保留指定天数）
     *
     * @param retainDays 保留天数
     */
    void clearOperationLog(Integer retainDays);
}