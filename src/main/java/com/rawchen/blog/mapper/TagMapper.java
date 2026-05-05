package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.Tag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 标签Mapper
 *
 * @author RawChen
 */
@Mapper
public interface TagMapper extends BaseMapper<Tag> {
}
