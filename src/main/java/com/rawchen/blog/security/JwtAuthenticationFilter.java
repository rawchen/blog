package com.rawchen.blog.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rawchen.blog.common.R;
import com.rawchen.blog.common.ResultCode;
import com.rawchen.blog.config.JwtConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * JWT认证过滤器
 *
 * @author RawChen
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtConfig jwtConfig;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    /**
     * 公开接口列表（不需要认证）
     */
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            // 文章公开接口（不含admin）
            "/api/article/article-list",
            "/api/article/detail/**",
            "/api/article/slug/**",
            "/api/article/view/**",
            "/api/article/like/**",
            "/api/article/search",
            "/api/article/timeline",
            "/api/article/random",
            "/api/article/recommend",
            "/api/article/*/related",
            "/api/article/latest-article",
            // 分类公开接口
            "/api/category/category-list",
            // 标签公开接口
            "/api/tag/list",
            // 评论公开接口
            "/api/comment/list/**",
            "/api/comment/latest-comment",
            "/api/comment/submit",
            "/api/comment/reply",
            "/api/comment/like/**",
            "/api/upload/**",
            "/api/config/**",
            "/api/friend-link/**",
            "/api/stat/**",
            "/feed",
            "/sitemap.xml",
            "/tag"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // 获取Token
        String token = getTokenFromRequest(request);

        if (StringUtils.hasText(token)) {
            try {
                // 从Token中获取用户名
                String username = jwtTokenUtil.getUsernameFromToken(token);

                // Token无效或过期（返回null表示解析失败）
                if (username == null) {
                    // 公开接口直接放行，需要认证的接口返回401
                    if (!isPublicPath(request.getRequestURI())) {
                        sendUnauthorizedResponse(response);
                        return;
                    }
                } else if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 加载用户信息
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    // 验证Token
                    if (jwtTokenUtil.validateToken(token, userDetails)) {
                        // 创建认证对象
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        // 设置到Security上下文
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.debug("设置用户认证信息: {}", username);
                    } else {
                        // Token验证失败
                        if (!isPublicPath(request.getRequestURI())) {
                            sendUnauthorizedResponse(response);
                            return;
                        }
                    }
                }
            } catch (Exception e) {
                log.error("JWT认证失败: {}", e.getMessage());
                // 公开接口直接放行，需要认证的接口返回401
                if (!isPublicPath(request.getRequestURI())) {
                    sendUnauthorizedResponse(response);
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 判断是否为公开接口
     */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    /**
     * 返回401未授权响应
     */
    private void sendUnauthorizedResponse(HttpServletResponse response) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        R<?> result = R.fail(ResultCode.UNAUTHORIZED.getCode(), "登录已过期，请重新登录");
        response.getWriter().write(new ObjectMapper().writeValueAsString(result));
    }

    /**
     * 从请求中获取Token
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(jwtConfig.getHeader());
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(jwtConfig.getTokenPrefix())) {
            return bearerToken.substring(jwtConfig.getTokenPrefix().length()).trim();
        }
        return null;
    }
}
