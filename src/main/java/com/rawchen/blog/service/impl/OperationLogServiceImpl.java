package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.entity.OperationLog;
import com.rawchen.blog.mapper.OperationLogMapper;
import com.rawchen.blog.service.OperationLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

/**
 * 操作日志服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class OperationLogServiceImpl implements OperationLogService {

    @Autowired
    private OperationLogMapper operationLogMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public PageResult<OperationLog> getOperationLogList(Long current, Long size, String operationType,
                                                         String targetType, String username,
                                                         String startTime, String endTime) {
        Page<OperationLog> page = new Page<>(current, size);
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();

        // 排除登录日志
        wrapper.and(w -> w.ne(OperationLog::getOperationType, "LOGIN")
                          .ne(OperationLog::getOperationType, "LOGOUT"));

        if (StringUtils.hasText(operationType)) {
            wrapper.eq(OperationLog::getOperationType, operationType);
        }
        if (StringUtils.hasText(targetType)) {
            wrapper.eq(OperationLog::getTargetType, targetType);
        }
        if (StringUtils.hasText(username)) {
            wrapper.like(OperationLog::getUsername, username);
        }
        if (StringUtils.hasText(startTime)) {
            wrapper.ge(OperationLog::getCreateTime, LocalDateTime.parse(startTime, DATE_FORMATTER));
        }
        if (StringUtils.hasText(endTime)) {
            wrapper.le(OperationLog::getCreateTime, LocalDateTime.parse(endTime, DATE_FORMATTER));
        }

        wrapper.orderByDesc(OperationLog::getCreateTime);

        Page<OperationLog> logPage = operationLogMapper.selectPage(page, wrapper);
        return PageResult.of(logPage);
    }

    @Override
    public PageResult<OperationLog> getLoginLogList(Long current, Long size, String username,
                                                     String startTime, String endTime) {
        Page<OperationLog> page = new Page<>(current, size);
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();

        // 只查询登录日志（LOGIN和LOGOUT）
        wrapper.and(w -> w.eq(OperationLog::getOperationType, "LOGIN")
                          .or()
                          .eq(OperationLog::getOperationType, "LOGOUT"));

        if (StringUtils.hasText(username)) {
            wrapper.like(OperationLog::getUsername, username);
        }
        if (StringUtils.hasText(startTime)) {
            wrapper.ge(OperationLog::getCreateTime, LocalDateTime.parse(startTime, DATE_FORMATTER));
        }
        if (StringUtils.hasText(endTime)) {
            wrapper.le(OperationLog::getCreateTime, LocalDateTime.parse(endTime, DATE_FORMATTER));
        }

        wrapper.orderByDesc(OperationLog::getCreateTime);

        Page<OperationLog> logPage = operationLogMapper.selectPage(page, wrapper);
        return PageResult.of(logPage);
    }

    @Override
    public OperationLog getOperationLogById(Long id) {
        return operationLogMapper.selectById(id);
    }

    @Override
    public void deleteOperationLog(Long id) {
        operationLogMapper.deleteById(id);
    }

    @Override
    public void batchDeleteOperationLog(List<Long> ids) {
        operationLogMapper.deleteBatchIds(ids);
    }

    @Override
    public void clearOperationLog(Integer retainDays) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(retainDays);
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.lt(OperationLog::getCreateTime, cutoffTime);
        int deleted = operationLogMapper.delete(wrapper);
        log.info("清空操作日志完成，删除{}条记录", deleted);
    }
}