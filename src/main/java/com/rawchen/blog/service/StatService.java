package com.rawchen.blog.service;

import com.rawchen.blog.vo.SiteStatVO;
import com.rawchen.blog.vo.TrendVO;

import java.util.List;

/**
 * 统计服务接口
 *
 * @author RawChen
 */
public interface StatService {

    /**
     * 获取站点统计
     */
    SiteStatVO getSiteStat();

    /**
     * 获取访问趋势
     */
    List<TrendVO> getVisitTrend(Integer days);

    /**
     * 记录PV
     */
    void recordPv(String ip);

    /**
     * 获取热门文章
     */
    List<Long> getHotArticles(Integer limit);

    /**
     * 获取热门标签
     */
    List<Long> getHotTags(Integer limit);
}