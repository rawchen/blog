package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 登录返回VO
 *
 * @author RawChen
 */
@Data
public class LoginVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Token
     */
    private String token;

    /**
     * Token类型
     */
    private String tokenType = "Bearer";

    /**
     * Token过期时间（秒）
     */
    private Long expiresIn;

    /**
     * 用户信息
     */
    private UserVO userInfo;
}
