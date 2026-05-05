package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.Moment;
import org.apache.ibatis.annotations.Mapper;

/**
 * 朋友圈Mapper
 *
 * @author RawChen
 */
@Mapper
public interface MomentMapper extends BaseMapper<Moment> {
}