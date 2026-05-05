package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.ArticleTag;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文章标签关联Mapper
 *
 * @author RawChen
 */
@Mapper
public interface ArticleTagMapper extends BaseMapper<ArticleTag> {
}
