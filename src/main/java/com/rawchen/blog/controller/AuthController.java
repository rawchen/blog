package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.LoginDTO;
import com.rawchen.blog.dto.RegisterDTO;
import com.rawchen.blog.service.AuthService;
import com.rawchen.blog.vo.LoginVO;
import com.rawchen.blog.vo.UserVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * 认证控制器
 *
 * @author RawChen
 */
@Api(tags = "认证管理")
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @ApiOperation("用户登录")
    @PostMapping("/login")
    public R<LoginVO> login(@Valid @RequestBody LoginDTO loginDTO) {
        return R.ok(authService.login(loginDTO));
    }

    @ApiOperation("用户注册")
    @PostMapping("/register")
    public R<Void> register(@Valid @RequestBody RegisterDTO registerDTO) {
        authService.register(registerDTO);
        return R.ok();
    }

    @ApiOperation("刷新Token")
    @PostMapping("/refresh")
    public R<LoginVO> refreshToken(@RequestParam String refreshToken) {
        return R.ok(authService.refreshToken(refreshToken));
    }

    @ApiOperation("获取当前用户信息")
    @GetMapping("/info")
    public R<UserVO> getCurrentUser() {
        return R.ok(authService.getCurrentUser());
    }

    @ApiOperation("退出登录")
    @PostMapping("/logout")
    public R<Void> logout() {
        authService.logout();
        return R.ok();
    }
}
