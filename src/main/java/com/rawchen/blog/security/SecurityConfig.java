package com.rawchen.blog.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security配置
 *
 * @author RawChen
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    /**
     * 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 认证管理器
     */
    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                // 关闭CSRF
                .csrf().disable()
                // 关闭Session
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()
                // 放行接口
                .antMatchers(
                        // API接口
                        "/tag",
                        "/api/auth/login",
                        "/api/auth/register",
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
                        // Swagger文档
                        "/doc.html",
                        "/webjars/**",
                        "/swagger-resources/**",
                        "/v2/api-docs/**",
                        // 静态资源
                        "/favicon.ico",
                        "/assets/**",
                        "/*.png",
                        "/*.jpg",
                        "/*.ico",
                        "/logo.png",
                        "/logo-footer.png",
                        // 前端路由页面
                        "/",
                        "/index.html",
                        "/*",
                        "/page/**",
                        "/category",
                        "/category/**",
                        "/tag",
                        "/tag/**",
                        "/archive",
                        "/search",
                        "/timeline",
                        "/moments",
                        "/friends",
                        "/admin/login"
                ).permitAll()
                // 后台管理接口需要 ADMIN 或 STAFF 角色
                .antMatchers("/api/**/admin/**").hasAnyRole("ADMIN", "STAFF")
                // 其他请求需要认证
                .anyRequest().authenticated()
                .and()
                // 添加JWT过滤器
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // 允许跨域
                .cors()
                .and()
                // 异常处理
                .exceptionHandling()
                .authenticationEntryPoint(jwtAuthenticationEntryPoint);
    }
}