package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.Tag;
import com.rawchen.blog.vo.ChartItemVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 标签Mapper
 *
 * @author RawChen
 */
@Mapper
public interface TagMapper extends BaseMapper<Tag> {

    /**
     * 获取各标签文章数（实时计算，Top 20）
     */
    @Select("SELECT t.tag_name as name, COUNT(at.article_id) as count FROM blog_tag t " +
            "LEFT JOIN blog_article_tag at ON t.id = at.tag_id " +
            "LEFT JOIN blog_article a ON at.article_id = a.id AND a.status = 1 " +
            "WHERE t.status = 1 " +
            "GROUP BY t.id, t.tag_name ORDER BY count DESC LIMIT 20")
    List<ChartItemVO> findTagArticleCount();
}
