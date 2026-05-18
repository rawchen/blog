package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.AccessLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 访问日志Mapper
 *
 * @author RawChen
 */
@Mapper
public interface AccessLogMapper extends BaseMapper<AccessLog> {
}