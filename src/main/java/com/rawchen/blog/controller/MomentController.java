package com.rawchen.blog.controller;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.annotation.AccessLogAnnotation;
import com.rawchen.blog.annotation.OperationLogAnnotation;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.MomentDTO;
import com.rawchen.blog.entity.Moment;
import com.rawchen.blog.enums.OperationType;
import com.rawchen.blog.enums.TargetType;
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
    @AccessLogAnnotation("MOMENTS")
    public R<PageResult<MomentVO>> getMomentList(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return R.ok(momentService.getMomentList(current, size));
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("根据ID获取动态")
    @GetMapping("/admin/{id}")
    public R<Moment> getMomentById(@PathVariable Long id) {
        return R.ok(momentService.getMomentById(id));
    }

    @ApiOperation("添加动态")
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @OperationLogAnnotation(type = OperationType.CREATE, target = TargetType.MOMENT, description = "添加动态", recordDetail = true)
    public R<Long> addMoment(@Valid @RequestBody MomentDTO dto) {
        return R.ok(momentService.addMoment(dto));
    }

    @ApiOperation("从RSS订阅拉取")
    @PostMapping("/admin/fetch")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> fetchFromRss(@RequestParam String rssUrl) {
        momentService.fetchFromRss(rssUrl);
        return R.ok();
    }

    @ApiOperation("删除动态")
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @OperationLogAnnotation(type = OperationType.DELETE, target = TargetType.MOMENT, description = "删除动态")
    public R<Void> deleteMoment(@PathVariable Long id) {
        momentService.deleteMoment(id);
        return R.ok();
    }
}