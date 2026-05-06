package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.entity.Category;
import com.rawchen.blog.mapper.ArticleMapper;
import com.rawchen.blog.mapper.CategoryMapper;
import com.rawchen.blog.service.CategoryService;
import com.rawchen.blog.vo.CategoryVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 分类服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private ArticleMapper articleMapper;

    @Override
    public List<CategoryVO> getCategoryList() {
        List<Category> categories = categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                .eq(Category::getStatus, 1)
                .orderByAsc(Category::getSortOrder));

        return categories.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public Category getCategoryById(Long id) {
        return categoryMapper.selectById(id);
    }

    @Override
    public Long createCategory(Category category) {
        category.setArticleCount(0);
        categoryMapper.insert(category);
        log.info("创建分类成功: {}", category.getCategoryName());
        return category.getId();
    }

    @Override
    public void updateCategory(Category category) {
        categoryMapper.updateById(category);
        log.info("更新分类成功: {}", category.getCategoryName());
    }

    @Override
    public void deleteCategory(Long id) {
        categoryMapper.deleteById(id);
        log.info("删除分类成功: {}", id);
    }

    private CategoryVO convertToVO(Category category) {
        CategoryVO vo = new CategoryVO();
        BeanUtils.copyProperties(category, vo);
        // 统计该分类下已发布文章数量
        Long count = articleMapper.selectCount(new LambdaQueryWrapper<com.rawchen.blog.entity.Article>()
                .eq(com.rawchen.blog.entity.Article::getCategoryId, category.getId())
                .eq(com.rawchen.blog.entity.Article::getStatus, 1));
        vo.setArticleCount(count != null ? count.intValue() : 0);
        return vo;
    }
}
