package com.rawchen.blog.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

/**
 * 迁移连接DTO
 *
 * @author RawChen
 */
@Data
public class MigrationConnectDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * MySQL主机地址
     */
    @NotBlank(message = "主机地址不能为空")
    private String host;

    /**
     * 端口号
     */
    @NotNull(message = "端口号不能为空")
    private Integer port;

    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    private String username;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    private String password;

    /**
     * 数据库名称
     */
    private String database;
}
