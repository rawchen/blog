package com.rawchen.blog.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.FriendLinkDTO;
import com.rawchen.blog.entity.FriendLink;
import com.rawchen.blog.service.FriendLinkService;
import com.rawchen.blog.vo.FriendLinkVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * 友链控制器
 *
 * @author RawChen
 */
@Api(tags = "友链管理")
@RestController
@RequestMapping("/api/friend-link")
public class FriendLinkController {

    @Autowired
    private FriendLinkService friendLinkService;

    @ApiOperation("获取友链列表（前台）")
    @GetMapping("/list")
    public R<List<FriendLinkVO>> getFriendLinkList() {
        return R.ok(friendLinkService.getFriendLinkList());
    }

    @ApiOperation("申请友链（前台）")
    @PostMapping("/apply")
    public R<Long> applyFriendLink(@Valid @RequestBody FriendLinkDTO dto) {
        return R.ok(friendLinkService.applyFriendLink(dto));
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("获取友链分页列表（后台）")
    @GetMapping("/admin/page")
    public R<Page<FriendLinkVO>> getFriendLinkPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return R.ok(friendLinkService.getFriendLinkPage(page, size));
    }

    @ApiOperation("根据ID获取友链")
    @GetMapping("/admin/{id}")
    public R<FriendLink> getFriendLinkById(@PathVariable Long id) {
        return R.ok(friendLinkService.getFriendLinkById(id));
    }

    @ApiOperation("添加友链")
    @PostMapping("/admin")
    public R<Long> addFriendLink(@Valid @RequestBody FriendLinkDTO dto) {
        return R.ok(friendLinkService.addFriendLink(dto));
    }

    @ApiOperation("更新友链")
    @PutMapping("/admin")
    public R<Void> updateFriendLink(@Valid @RequestBody FriendLinkDTO dto) {
        friendLinkService.updateFriendLink(dto);
        return R.ok();
    }

    @ApiOperation("删除友链")
    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> deleteFriendLink(@PathVariable Long id) {
        friendLinkService.deleteFriendLink(id);
        return R.ok();
    }

    @ApiOperation("审核友链")
    @PutMapping("/admin/{id}/audit")
    public R<Void> auditFriendLink(@PathVariable Long id, @RequestParam Integer status) {
        friendLinkService.auditFriendLink(id, status);
        return R.ok();
    }

    @ApiOperation("检测友链状态")
    @PostMapping("/admin/check/{id}")
    public R<Void> checkFriendLinkStatus(@PathVariable Long id) {
        friendLinkService.checkFriendLinkStatus(id);
        return R.ok();
    }
}
