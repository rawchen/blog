package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.ArticleTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

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

    /**
     * 批量统计标签下已发布文章数量
     * @return List<Map> 每个Map包含 tag_id 和 article_count
     */
    @Select("SELECT at.tag_id, COUNT(*) as article_count FROM blog_article_tag at " +
            "JOIN blog_article a ON at.article_id = a.id " +
            "WHERE a.status = 1 AND a.is_deleted = 0 " +
            "GROUP BY at.tag_id")
    List<Map<String, Object>> countPublishedArticlesByTagIds();
}
