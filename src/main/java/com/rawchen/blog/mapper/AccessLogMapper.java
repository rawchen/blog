package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.AccessLog;
import com.rawchen.blog.vo.AccessTrendVO;
import com.rawchen.blog.vo.ChartItemVO;
import com.rawchen.blog.vo.PageTypeCompareVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 访问日志Mapper
 *
 * @author RawChen
 */
@Mapper
public interface AccessLogMapper extends BaseMapper<AccessLog> {

    /**
     * 统计指定时间段内的访问量
     */
    @Select("SELECT COUNT(*) FROM sys_access_log WHERE create_time >= #{startTime} AND create_time < #{endTime}")
    long countAccessBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 统计指定时间段内的独立访客数
     */
    @Select("SELECT COUNT(DISTINCT ip_address) FROM sys_access_log WHERE create_time >= #{startTime} AND create_time < #{endTime}")
    long countUniqueVisitorsBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 统计指定时间段内的总访问量
     */
    @Select("SELECT COUNT(*) FROM sys_access_log WHERE create_time >= #{startTime}")
    long countAccessSince(@Param("startTime") LocalDateTime startTime);

    /**
     * 统计指定时间段内的独立访客数
     */
    @Select("SELECT COUNT(DISTINCT ip_address) FROM sys_access_log WHERE create_time >= #{startTime}")
    long countUniqueVisitorsSince(@Param("startTime") LocalDateTime startTime);

    /**
     * 获取30天访问趋势数据
     */
    @Select("SELECT DATE_FORMAT(create_time, '%m-%d') as date, COUNT(*) as pv, COUNT(DISTINCT ip_address) as uv " +
            "FROM sys_access_log WHERE create_time >= #{startTime} " +
            "GROUP BY DATE(create_time) ORDER BY DATE(create_time)")
    List<AccessTrendVO> findAccessTrend(@Param("startTime") LocalDateTime startTime);

    /**
     * 获取访问量最高的文章 (含标题)
     */
    @Select("SELECT a.title as name, COUNT(*) as count FROM sys_access_log l " +
            "JOIN blog_article a ON l.article_id = a.id " +
            "WHERE l.create_time >= #{startTime} AND l.article_id IS NOT NULL AND a.status = 1 " +
            "GROUP BY l.article_id ORDER BY count DESC LIMIT #{limit}")
    List<ChartItemVO> findTopArticlesByAccess(@Param("startTime") LocalDateTime startTime, @Param("limit") int limit);

    /**
     * 获取浏览器分布统计
     */
    @Select("SELECT browser as name, COUNT(*) as count FROM sys_access_log " +
            "WHERE create_time >= #{startTime} AND browser IS NOT NULL AND browser != '' " +
            "GROUP BY browser ORDER BY count DESC LIMIT #{limit}")
    List<ChartItemVO> findBrowserDistribution(@Param("startTime") LocalDateTime startTime, @Param("limit") int limit);

    /**
     * 获取操作系统分布统计
     */
    @Select("SELECT os as name, COUNT(*) as count FROM sys_access_log " +
            "WHERE create_time >= #{startTime} AND os IS NOT NULL AND os != '' " +
            "GROUP BY os ORDER BY count DESC LIMIT #{limit}")
    List<ChartItemVO> findOsDistribution(@Param("startTime") LocalDateTime startTime, @Param("limit") int limit);

    /**
     * 获取省份分布统计 (中国)
     */
    @Select("SELECT province as name, COUNT(*) as count FROM sys_access_log " +
            "WHERE create_time >= #{startTime} AND province IS NOT NULL AND province != '' AND province != '0' " +
            "GROUP BY province ORDER BY count DESC LIMIT #{limit}")
    List<ChartItemVO> findProvinceDistribution(@Param("startTime") LocalDateTime startTime, @Param("limit") int limit);

    /**
     * 获取来源域名分布统计
     */
    @Select("SELECT referer_domain as name, COUNT(*) as count FROM sys_access_log " +
            "WHERE create_time >= #{startTime} AND referer_domain IS NOT NULL AND referer_domain != '' " +
            "GROUP BY referer_domain ORDER BY count DESC LIMIT #{limit}")
    List<ChartItemVO> findRefererDomainDistribution(@Param("startTime") LocalDateTime startTime, @Param("limit") int limit);

    /**
     * 获取操作类型分布统计
     */
    @Select("SELECT operation as name, COUNT(*) as count FROM sys_access_log " +
            "WHERE create_time >= #{startTime} AND operation IS NOT NULL AND operation != '' " +
            "GROUP BY operation ORDER BY count DESC LIMIT #{limit}")
    List<ChartItemVO> findOperationDistribution(@Param("startTime") LocalDateTime startTime, @Param("limit") int limit);

    /**
     * 获取访客国家分布统计
     */
    @Select("SELECT country as name, COUNT(*) as count FROM sys_access_log " +
            "WHERE create_time >= #{startTime} AND country IS NOT NULL AND country != '' " +
            "GROUP BY country ORDER BY count DESC LIMIT #{limit}")
    List<ChartItemVO> findCountryDistribution(@Param("startTime") LocalDateTime startTime, @Param("limit") int limit);

    /**
     * 获取访客城市分布统计 (包含省份信息)
     */
    @Select("SELECT CONCAT(province, ' ', city) as name, province, city, COUNT(*) as count FROM sys_access_log " +
            "WHERE create_time >= #{startTime} AND province IS NOT NULL AND province != '' AND province != '0' " +
            "GROUP BY province, city ORDER BY count DESC LIMIT #{limit}")
    List<Map<String, Object>> findCityDistribution(@Param("startTime") LocalDateTime startTime, @Param("limit") int limit);

    /**
     * 获取页面类型访问对比统计（昨日vs今日）
     * 过滤掉隐藏的独立页面(status=3)
     */
    @Select("SELECT " +
            "CASE WHEN l.operation = 'PAGE' THEN CONCAT('页面: ', a.title) ELSE l.operation END as name, " +
            "SUM(CASE WHEN l.create_time >= #{yesterdayStart} AND l.create_time < #{todayStart} THEN 1 ELSE 0 END) as yesterdayCount, " +
            "SUM(CASE WHEN l.create_time >= #{todayStart} THEN 1 ELSE 0 END) as todayCount " +
            "FROM sys_access_log l " +
            "LEFT JOIN blog_article a ON l.article_id = a.id AND l.operation = 'PAGE' " +
            "WHERE l.create_time >= #{yesterdayStart} " +
            "AND l.operation IS NOT NULL AND l.operation != '' " +
            "AND (l.operation != 'PAGE' OR (a.id IS NOT NULL AND a.status != 3)) " +
            "GROUP BY CASE WHEN l.operation = 'PAGE' THEN CONCAT('页面: ', a.title) ELSE l.operation END " +
            "HAVING SUM(CASE WHEN l.create_time >= #{yesterdayStart} AND l.create_time < #{todayStart} THEN 1 ELSE 0 END) > 0 " +
            "OR SUM(CASE WHEN l.create_time >= #{todayStart} THEN 1 ELSE 0 END) > 0 " +
            "ORDER BY (SUM(CASE WHEN l.create_time >= #{yesterdayStart} AND l.create_time < #{todayStart} THEN 1 ELSE 0 END) + " +
            "SUM(CASE WHEN l.create_time >= #{todayStart} THEN 1 ELSE 0 END)) DESC " +
            "LIMIT #{limit}")
    List<PageTypeCompareVO> findPageTypeCompare(@Param("yesterdayStart") LocalDateTime yesterdayStart,
                                                 @Param("todayStart") LocalDateTime todayStart,
                                                 @Param("limit") int limit);

    /**
     * 获取全表总访问量(PV)
     */
    @Select("SELECT COUNT(*) FROM sys_access_log")
    long countTotalPv();

    /**
     * 获取全表独立访客数(UV)
     */
    @Select("SELECT COUNT(DISTINCT ip_address) FROM sys_access_log")
    long countTotalUv();
}