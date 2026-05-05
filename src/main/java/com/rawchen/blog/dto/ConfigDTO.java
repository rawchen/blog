package com.rawchen.blog.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * 配置DTO
 *
 * @author RawChen
 */
@Data
public class ConfigDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 配置键
     */
    @NotBlank(message = "配置键不能为空")
    private String configKey;

    /**
     * 配置值
     */
    private String configValue;

    /**
     * 配置类型
     */
    private String configType;

    /**
     * 描述
     */
    private String description;
}
