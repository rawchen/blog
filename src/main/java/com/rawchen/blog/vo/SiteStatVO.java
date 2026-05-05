package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 站点统计VO
 *
 * @author RawChen
 */
@Data
public class SiteStatVO implements Serializable {

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
    private Integer todayPv;

    /**
     * 今日UV
     */
    private Integer todayUv;
}
