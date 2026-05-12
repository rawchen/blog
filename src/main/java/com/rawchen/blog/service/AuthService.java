package com.rawchen.blog.service;

import com.rawchen.blog.dto.LoginDTO;
import com.rawchen.blog.dto.RegisterDTO;
import com.rawchen.blog.vo.LoginVO;
import com.rawchen.blog.vo.UserVO;

/**
 * 认证服务接口
 *
 * @author RawChen
 */
public interface AuthService {

    /**
     * 用户登录
     */
    LoginVO login(LoginDTO loginDTO);

    /**
     * 用户注册
     */
    void register(RegisterDTO registerDTO);

    /**
     * 获取当前用户信息
     */
    UserVO getCurrentUser();

    /**
     * 退出登录
     */
    void logout();
}
