package com.rawchen.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 图表单项VO (用于排行榜等)
 *
 * @author RawChen
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartItemVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 名称 (如文章标题、浏览器名称等)
     */
    private String name;

    /**
     * 数值
     */
    private Long count;
}