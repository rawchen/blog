package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.ArticleTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 文章标签关联Mapper
 *
 * @author RawChen
 */
@Mapper
public interface ArticleTagMapper extends BaseMapper<ArticleTag> {

    /**
     * 统计标签下已发布文章数量
     */
    @Select("SELECT COUNT(*) FROM blog_article_tag at " +
            "JOIN blog_article a ON at.article_id = a.id " +
            "WHERE at.tag_id = #{tagId} AND a.status = 1 AND a.is_deleted = 0")
    Long countPublishedArticlesByTagId(@Param("tagId") Long tagId);
}
