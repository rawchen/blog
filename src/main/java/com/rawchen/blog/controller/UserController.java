package com.rawchen.blog.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.common.R;
import com.rawchen.blog.entity.User;
import com.rawchen.blog.mapper.UserMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器
 *
 * @author RawChen
 */
@Api(tags = "用户管理")
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @ApiOperation("分页查询用户列表")
    @GetMapping("/admin/list")
    @PreAuthorize("hasRole('ADMIN')")
    public R<PageResult<User>> getUserList(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) String keyword) {

        Page<User> page = new Page<>(current, size);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(User::getUsername, keyword)
                    .or()
                    .like(User::getNickname, keyword)
                    .or()
                    .like(User::getEmail, keyword));
        }

        wrapper.orderByDesc(User::getCreateTime);
        Page<User> userPage = userMapper.selectPage(page, wrapper);

        // 清除密码信息
        userPage.getRecords().forEach(user -> user.setPassword(null));

        return R.ok(PageResult.of(userPage));
    }

    @ApiOperation("更新用户状态")
    @PutMapping("/admin/status/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> updateUserStatus(@PathVariable Long id, @RequestParam Integer status) {
        User user = userMapper.selectById(id);
        if (user == null) {
            return R.fail("用户不存在");
        }
        user.setStatus(status);
        userMapper.updateById(user);
        return R.ok();
    }

    @ApiOperation("重置用户密码")
    @PutMapping("/admin/reset-password/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<String> resetPassword(@PathVariable Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            return R.fail("用户不存在");
        }
        user.setPassword(passwordEncoder.encode("123456"));
        userMapper.updateById(user);
        return R.ok("密码已重置为: 123456");
    }

    @ApiOperation("更新用户角色")
    @PutMapping("/admin/role/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<Void> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        User user = userMapper.selectById(id);
        if (user == null) {
            return R.fail("用户不存在");
        }
        try {
            user.setRole(User.UserRole.valueOf(role));
            userMapper.updateById(user);
            return R.ok();
        } catch (IllegalArgumentException e) {
            return R.fail("无效的角色: " + role);
        }
    }
}
