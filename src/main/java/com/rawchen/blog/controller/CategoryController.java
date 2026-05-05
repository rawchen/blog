package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.entity.Category;
import com.rawchen.blog.service.CategoryService;
import com.rawchen.blog.vo.CategoryVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类控制器
 *
 * @author RawChen
 */
@Api(tags = "分类管理")
@RestController
@RequestMapping("/category")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @ApiOperation("获取分类列表")
    @GetMapping("/list")
    public R<List<CategoryVO>> getCategoryList() {
        return R.ok(categoryService.getCategoryList());
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("根据ID获取分类")
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:category:query')")
    public R<Category> getCategoryById(@PathVariable Long id) {
        return R.ok(categoryService.getCategoryById(id));
    }

    @ApiOperation("创建分类")
    @PostMapping("/admin")
    @PreAuthorize("hasAuthority('content:category:add')")
    public R<Long> createCategory(@RequestBody Category category) {
        return R.ok(categoryService.createCategory(category));
    }

    @ApiOperation("更新分类")
    @PutMapping("/admin")
    @PreAuthorize("hasAuthority('content:category:edit')")
    public R<Void> updateCategory(@RequestBody Category category) {
        categoryService.updateCategory(category);
        return R.ok();
    }

    @ApiOperation("删除分类")
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:category:delete')")
    public R<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return R.ok();
    }
}
