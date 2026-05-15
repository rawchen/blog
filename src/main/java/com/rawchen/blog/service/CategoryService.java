package com.rawchen.blog.service;

import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.entity.Category;
import com.rawchen.blog.vo.CategoryVO;

import java.util.List;

/**
 * 分类服务接口
 *
 * @author RawChen
 */
public interface CategoryService {

    /**
     * 获取所有分类列表
     */
    List<CategoryVO> getCategoryList();

    /**
     * 分页获取分类列表（后台）
     */
    PageResult<CategoryVO> getCategoryListAdmin(Long current, Long size, String keyword);

    /**
     * 根据ID获取分类
     */
    Category getCategoryById(Long id);

    /**
     * 创建分类
     */
    Long createCategory(Category category);

    /**
     * 更新分类
     */
    void updateCategory(Category category);

    /**
     * 删除分类
     */
    void deleteCategory(Long id);
}
