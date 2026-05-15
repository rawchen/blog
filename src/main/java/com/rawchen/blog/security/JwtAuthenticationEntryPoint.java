package com.rawchen.blog.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rawchen.blog.common.R;
import com.rawchen.blog.common.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * JWT认证入口点 - 处理未认证请求
 *
 * @author RawChen
 */
@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        String uri = request.getRequestURI();
        // 只对API路径记录WARN级别，其他路径（如扫描器探测）用DEBUG减少日志噪音
        if (uri.startsWith("/api/")) {
            log.warn("认证失败: {} - 请求路径: {}", authException.getMessage(), uri);
        } else {
            log.debug("认证失败: {} - 请求路径: {}", authException.getMessage(), uri);
        }

        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        R<?> result = R.fail(ResultCode.UNAUTHORIZED.getCode(), "登录已过期，请重新登录");
        response.getWriter().write(new ObjectMapper().writeValueAsString(result));
    }
}
