package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.Category;
import com.rawchen.blog.vo.ChartItemVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 分类Mapper
 *
 * @author RawChen
 */
@Mapper
public interface CategoryMapper extends BaseMapper<Category> {

    /**
     * 获取各分类文章数（实时计算）
     */
    @Select("SELECT c.category_name as name, COUNT(a.id) as count FROM blog_category c " +
            "LEFT JOIN blog_article a ON c.id = a.category_id AND a.status = 1 " +
            "WHERE c.status = 1 " +
            "GROUP BY c.id, c.category_name ORDER BY count DESC")
    List<ChartItemVO> findCategoryArticleCount();
}
