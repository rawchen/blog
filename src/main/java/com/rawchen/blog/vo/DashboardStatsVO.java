package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 仪表盘统计VO
 *
 * @author RawChen
 */
@Data
public class DashboardStatsVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 文章总数
     */
    private Long articleCount;

    /**
     * 评论总数
     */
    private Long commentCount;

    /**
     * 分类总数
     */
    private Long categoryCount;

    /**
     * 标签总数
     */
    private Long tagCount;

    /**
     * 用户总数
     */
    private Long userCount;

    /**
     * 总浏览量
     */
    private Long totalViewCount;

    /**
     * 总点赞量
     */
    private Long totalLikeCount;

    /**
     * 今日PV
     */
    private Long todayPv;

    /**
     * 今日UV
     */
    private Long todayUv;

    /**
     * 昨日PV
     */
    private Long yesterdayPv;

    /**
     * 昨日UV
     */
    private Long yesterdayUv;

    /**
     * 30天总访问量
     */
    private Long totalAccess30Days;

    /**
     * 30天独立访客数
     */
    private Long uniqueVisitors30Days;
}