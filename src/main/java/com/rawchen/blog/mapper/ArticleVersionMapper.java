package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.ArticleVersion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 文章版本历史Mapper
 *
 * @author RawChen
 */
@Mapper
public interface ArticleVersionMapper extends BaseMapper<ArticleVersion> {

    /**
     * 获取文章的最大版本号
     */
    @Select("SELECT MAX(version) FROM blog_article_version WHERE article_id = #{articleId}")
    Integer getMaxVersion(Long articleId);
}
