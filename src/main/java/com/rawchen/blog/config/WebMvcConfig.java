package com.rawchen.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Web MVC配置
 *
 * @author RawChen
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private String uploadPath;

    @Value("${upload.url-prefix:/uploads}")
    private String urlPrefix;

    @Value("${upload.path:uploads}")
    public void setUploadPath(String path) {
        // 使用工作目录作为基础路径
        this.uploadPath = System.getProperty("user.dir") + "/" + path;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置上传文件的静态资源访问
        registry.addResourceHandler(urlPrefix + "/**")
                .addResourceLocations("file:" + uploadPath + "/");

        // Knife4j/Swagger 静态资源
        registry.addResourceHandler("doc.html")
                .addResourceLocations("classpath:/META-INF/resources/");
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/");

        // SPA 路由支持：对于非静态资源的请求，返回 index.html
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) {
                        try {
                            Resource requestedResource = location.createRelative(resourcePath);

                            // 如果资源存在且可读，则直接返回
                            if (requestedResource.exists() && requestedResource.isReadable()) {
                                return requestedResource;
                            }

                            // 如果是 API 请求，返回 null（让后续处理器处理）
                            if (resourcePath.startsWith("api/")) {
                                return null;
                            }

                            // 其他请求返回 index.html（SPA 路由）
                            return new ClassPathResource("/static/index.html");
                        } catch (Exception e) {
                            return null;
                        }
                    }
                });
    }
}
