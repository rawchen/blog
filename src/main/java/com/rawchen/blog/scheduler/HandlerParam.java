package com.rawchen.blog.scheduler;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 处理器参数定义
 *
 * @author RawChen
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandlerParam {

    /**
     * 参数名（对应JobDataMap中的key）
     */
    private String name;

    /**
     * 参数标签（显示名称）
     */
    private String label;

    /**
     * 参数类型：string, number, password, select, textarea, switch
     */
    private String type;

    /**
     * 是否必填
     */
    private boolean required;

    /**
     * 默认值
     */
    private String defaultValue;

    /**
     * 占位提示
     */
    private String placeholder;

    /**
     * 帮助提示
     */
    private String tooltip;

    /**
     * 下拉选项（用于select类型）格式：value:label,value:label
     */
    private String options;

    /**
     * 最小值（用于number类型）
     */
    private Integer min;

    /**
     * 最大值（用于number类型）
     */
    private Integer max;
}
