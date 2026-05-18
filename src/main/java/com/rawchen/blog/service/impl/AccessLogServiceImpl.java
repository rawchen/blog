package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.entity.AccessLog;
import com.rawchen.blog.mapper.AccessLogMapper;
import com.rawchen.blog.service.AccessLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 访问日志服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class AccessLogServiceImpl implements AccessLogService {

    @Autowired
    private AccessLogMapper accessLogMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public PageResult<AccessLog> getAccessLogList(Long current, Long size, String operation,
                                                   String ipAddress, String startTime, String endTime) {
        Page<AccessLog> page = new Page<>(current, size);
        LambdaQueryWrapper<AccessLog> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(operation)) {
            wrapper.eq(AccessLog::getOperation, operation);
        }
        if (StringUtils.hasText(ipAddress)) {
            wrapper.like(AccessLog::getIpAddress, ipAddress);
        }
        if (StringUtils.hasText(startTime)) {
            wrapper.ge(AccessLog::getCreateTime, LocalDateTime.parse(startTime, DATE_FORMATTER));
        }
        if (StringUtils.hasText(endTime)) {
            wrapper.le(AccessLog::getCreateTime, LocalDateTime.parse(endTime, DATE_FORMATTER));
        }

        wrapper.orderByDesc(AccessLog::getCreateTime);

        Page<AccessLog> logPage = accessLogMapper.selectPage(page, wrapper);
        return PageResult.of(logPage);
    }

    @Override
    public AccessLog getAccessLogById(Long id) {
        return accessLogMapper.selectById(id);
    }

    @Override
    public void deleteAccessLog(Long id) {
        accessLogMapper.deleteById(id);
    }

    @Override
    public void batchDeleteAccessLog(List<Long> ids) {
        accessLogMapper.deleteBatchIds(ids);
    }

    @Override
    public void clearAccessLog(Integer retainDays) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(retainDays);
        LambdaQueryWrapper<AccessLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.lt(AccessLog::getCreateTime, cutoffTime);
        int deleted = accessLogMapper.delete(wrapper);
        log.info("清空访问日志完成，删除{}条记录", deleted);
    }

    @Override
    public void saveAccessLog(AccessLog accessLog) {
        accessLogMapper.insert(accessLog);
    }
}