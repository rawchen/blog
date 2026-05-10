package com.rawchen.blog.security;

import com.rawchen.blog.entity.User;
import com.rawchen.blog.mapper.PermissionMapper;
import com.rawchen.blog.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户详情服务实现
 *
 * @author RawChen
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PermissionMapper permissionMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 查询用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));

        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        // 查询用户权限
        List<String> permissions = permissionMapper.selectPermissionsByUserId(user.getId());

        // 如果是admin用户，添加所有管理权限
        if ("admin".equals(username)) {
            permissions.add("content:article:query");
            permissions.add("content:article:add");
            permissions.add("content:article:edit");
            permissions.add("content:article:delete");
            permissions.add("content:category:query");
            permissions.add("content:category:add");
            permissions.add("content:category:edit");
            permissions.add("content:category:delete");
            permissions.add("content:tag:query");
            permissions.add("content:tag:add");
            permissions.add("content:tag:edit");
            permissions.add("content:tag:delete");
            permissions.add("content:comment:query");
            permissions.add("content:comment:delete");
            permissions.add("content:friend-link:query");
            permissions.add("content:friend-link:add");
            permissions.add("content:friend-link:edit");
            permissions.add("content:friend-link:delete");
            permissions.add("system:user:query");
            permissions.add("system:user:add");
            permissions.add("system:user:edit");
            permissions.add("system:user:delete");
            permissions.add("system:config:query");
            permissions.add("system:config:edit");
        }

        // 转换为Spring Security的权限列表
        List<SimpleGrantedAuthority> authorities = permissions.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        // 构建UserDetails
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .disabled(user.getStatus() == 0)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .authorities(authorities)
                .build();
    }
}
