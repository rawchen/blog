package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 访问趋势VO (用于30天趋势图)
 *
 * @author RawChen
 */
@Data
public class AccessTrendVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 日期 (格式: MM-dd)
     */
    private String date;

    /**
     * PV页面浏览量
     */
    private Long pv;

    /**
     * UV独立访客数
     */
    private Long uv;
}