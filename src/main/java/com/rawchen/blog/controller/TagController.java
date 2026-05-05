package com.rawchen.blog.controller;

import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.R;
import com.rawchen.blog.entity.Tag;
import com.rawchen.blog.service.TagService;
import com.rawchen.blog.vo.TagVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 标签控制器
 *
 * @author RawChen
 */
@Api(tags = "标签管理")
@RestController
@RequestMapping("/tag")
public class TagController {

    @Autowired
    private TagService tagService;

    @ApiOperation("获取标签列表")
    @GetMapping("/list")
    public R<List<TagVO>> getTagList() {
        return R.ok(tagService.getTagList());
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("分页查询标签列表")
    @GetMapping("/admin/list")
    @PreAuthorize("hasAuthority('content:tag:query')")
    public R<PageResult<TagVO>> getTagListPage(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String keyword) {
        return R.ok(tagService.getTagListPage(current, size, keyword));
    }

    @ApiOperation("根据ID获取标签")
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:tag:query')")
    public R<Tag> getTagById(@PathVariable Long id) {
        return R.ok(tagService.getTagById(id));
    }

    @ApiOperation("创建标签")
    @PostMapping("/admin")
    @PreAuthorize("hasAuthority('content:tag:add')")
    public R<Long> createTag(@RequestBody Tag tag) {
        return R.ok(tagService.createTag(tag));
    }

    @ApiOperation("更新标签")
    @PutMapping("/admin")
    @PreAuthorize("hasAuthority('content:tag:edit')")
    public R<Void> updateTag(@RequestBody Tag tag) {
        tagService.updateTag(tag);
        return R.ok();
    }

    @ApiOperation("删除标签")
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:tag:delete')")
    public R<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return R.ok();
    }
}
