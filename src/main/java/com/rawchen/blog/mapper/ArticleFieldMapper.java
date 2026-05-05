package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.ArticleField;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文章自定义字段Mapper
 *
 * @author RawChen
 */
@Mapper
public interface ArticleFieldMapper extends BaseMapper<ArticleField> {
}
