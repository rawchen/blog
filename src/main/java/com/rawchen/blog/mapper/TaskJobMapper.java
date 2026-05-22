package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.TaskJob;
import org.apache.ibatis.annotations.Mapper;

/**
 * 任务定义Mapper
 *
 * @author RawChen
 */
@Mapper
public interface TaskJobMapper extends BaseMapper<TaskJob> {
}
