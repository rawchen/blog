package com.rawchen.blog.controller;

import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.MomentDTO;
import com.rawchen.blog.entity.Moment;
import com.rawchen.blog.service.MomentService;
import com.rawchen.blog.vo.MomentVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * 朋友圈控制器
 *
 * @author RawChen
 */
@Api(tags = "朋友圈管理")
@RestController
@RequestMapping("/api/moment")
public class MomentController {

    @Autowired
    private MomentService momentService;

    @ApiOperation("获取朋友圈列表（前台）")
    @GetMapping("/list")
    public R<PageResult<MomentVO>> getMomentList(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return R.ok(momentService.getMomentList(current, size));
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("根据ID获取动态")
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:moment:query')")
    public R<Moment> getMomentById(@PathVariable Long id) {
        return R.ok(momentService.getMomentById(id));
    }

    @ApiOperation("添加动态")
    @PostMapping("/admin")
    @PreAuthorize("hasAuthority('content:moment:add')")
    public R<Long> addMoment(@Valid @RequestBody MomentDTO dto) {
        return R.ok(momentService.addMoment(dto));
    }

    @ApiOperation("从RSS订阅拉取")
    @PostMapping("/admin/fetch")
    @PreAuthorize("hasAuthority('content:moment:add')")
    public R<Void> fetchFromRss(@RequestParam String rssUrl) {
        momentService.fetchFromRss(rssUrl);
        return R.ok();
    }

    @ApiOperation("删除动态")
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('content:moment:delete')")
    public R<Void> deleteMoment(@PathVariable Long id) {
        momentService.deleteMoment(id);
        return R.ok();
    }
}