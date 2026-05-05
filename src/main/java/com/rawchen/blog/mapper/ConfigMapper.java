package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.Config;
import org.apache.ibatis.annotations.Mapper;

/**
 * 配置Mapper
 *
 * @author RawChen
 */
@Mapper
public interface ConfigMapper extends BaseMapper<Config> {
}
