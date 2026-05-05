package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * 访问趋势VO
 *
 * @author RawChen
 */
@Data
public class TrendVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 日期
     */
    private LocalDate date;

    /**
     * PV数量
     */
    private Integer pvCount;

    /**
     * UV数量
     */
    private Integer uvCount;
}
