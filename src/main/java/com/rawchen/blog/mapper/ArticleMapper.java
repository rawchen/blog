package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.Article;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文章Mapper
 *
 * @author RawChen
 */
@Mapper
public interface ArticleMapper extends BaseMapper<Article> {
}
