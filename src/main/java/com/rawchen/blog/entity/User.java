package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

/**
 * 用户实体
 *
 * @author RawChen
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_user")
public class User extends BaseEntity implements UserDetails {

    private static final long serialVersionUID = 1L;

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 头像
     */
    private String avatar;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 性别 0-未知 1-男 2-女
     */
    private Integer gender;

    /**
     * 生日
     */
    private LocalDate birthday;

    /**
     * 个性签名
     */
    private String signature;

    /**
     * 状态 0-禁用 1-正常
     */
    private Integer status;

    /**
     * 角色: ADMIN-超管, STAFF-管理员
     */
    @TableField("role")
    private UserRole role = UserRole.STAFF;

    /**
     * 权限列表（不存数据库，用于认证）
     */
    @TableField(exist = false)
    private Collection<? extends GrantedAuthority> authorities;

    /**
     * 用户角色枚举
     */
    public enum UserRole {
        ADMIN, STAFF
    }

    // ========== UserDetails 接口实现 ==========

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities != null ? authorities : Collections.emptyList();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status != null && status == 1;
    }
}