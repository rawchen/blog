package com.rawchen.blog.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rawchen.blog.common.R;
import com.rawchen.blog.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 访问拒绝处理器 - 处理权限不足的情况
 *
 * @author RawChen
 */
@Slf4j
@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request,
                        HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String message = "权限不足";

        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            if ("VISITOR".equals(user.getRole().name())) {
                message = "访客用户，不允许操作";
            }
        }

        log.warn("访问被拒绝: {} - 用户: {}", request.getRequestURI(),
                authentication != null ? authentication.getName() : "unknown");

        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        R<?> result = R.fail(403, message);
        response.getWriter().write(new ObjectMapper().writeValueAsString(result));
    }
}
