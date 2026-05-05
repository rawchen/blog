package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.Category;
import org.apache.ibatis.annotations.Mapper;

/**
 * 分类Mapper
 *
 * @author RawChen
 */
@Mapper
public interface CategoryMapper extends BaseMapper<Category> {
}
