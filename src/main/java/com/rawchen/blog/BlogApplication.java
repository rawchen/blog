package com.rawchen.blog;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 博客系统启动类
 *
 * @author RawChen
 */
@SpringBootApplication
@EnableTransactionManagement
@MapperScan("com.rawchen.blog.mapper")
public class BlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(BlogApplication.class, args);
        System.out.println("====================================");
        System.out.println("博客系统启动成功!");
        System.out.println("API文档地址: http://localhost:9999/api/doc.html");
        System.out.println("====================================");
    }
}
