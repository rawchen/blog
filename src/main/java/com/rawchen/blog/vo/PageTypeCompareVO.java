package com.rawchen.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 页面类型对比VO (用于昨日今日对比图表)
 *
 * @author RawChen
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageTypeCompareVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 页面类型名称
     */
    private String name;

    /**
     * 昨日访问量
     */
    private Long yesterdayCount;

    /**
     * 今日访问量
     */
    private Long todayCount;
}
