package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 登录返回VO
 *
 * @author RawChen
 */
@Data
public class LoginVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Access Token
     */
    private String accessToken;

    /**
     * Refresh Token
     */
    private String refreshToken;

    /**
     * Token类型
     */
    private String tokenType = "Bearer";

    /**
     * Access Token过期时间（秒）
     */
    private Long expiresIn;

    /**
     * 用户信息
     */
    private UserVO userInfo;

    /**
     * 用户权限列表
     */
    private List<String> permissions;

    /**
     * 用户角色列表
     */
    private List<String> roles;
}
