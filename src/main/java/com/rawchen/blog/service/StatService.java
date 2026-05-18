package com.rawchen.blog.service;

import com.rawchen.blog.vo.AccessTrendVO;
import com.rawchen.blog.vo.ChartItemVO;
import com.rawchen.blog.vo.DashboardStatsVO;
import com.rawchen.blog.vo.SiteStatVO;
import com.rawchen.blog.vo.TrendVO;

import java.util.List;
import java.util.Map;

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

    // ========== 仪表盘统计 ==========

    /**
     * 获取仪表盘统计数据
     */
    DashboardStatsVO getDashboardStats();

    /**
     * 获取30天访问趋势
     */
    List<AccessTrendVO> getAccessTrend();

    /**
     * 获取热门文章排行 (按访问量)
     */
    List<ChartItemVO> getTopArticles(int limit);

    /**
     * 获取浏览器分布
     */
    List<ChartItemVO> getBrowserDistribution();

    /**
     * 获取操作系统分布
     */
    List<ChartItemVO> getOsDistribution();

    /**
     * 获取省份分布
     */
    List<ChartItemVO> getProvinceDistribution();

    /**
     * 获取来源域名分布
     */
    List<ChartItemVO> getRefererDomainDistribution();

    /**
     * 获取操作类型分布
     */
    List<ChartItemVO> getOperationDistribution();

    /**
     * 获取分类文章数统计
     */
    List<ChartItemVO> getCategoryArticleCount();

    /**
     * 获取标签文章数统计
     */
    List<ChartItemVO> getTagArticleCount();

    /**
     * 获取访客国家分布
     */
    List<ChartItemVO> getCountryDistribution();

    /**
     * 获取访客城市分布
     */
    List<Map<String, Object>> getCityDistribution();
}