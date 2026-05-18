package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.service.StatService;
import com.rawchen.blog.vo.AccessTrendVO;
import com.rawchen.blog.vo.ChartItemVO;
import com.rawchen.blog.vo.DashboardStatsVO;
import com.rawchen.blog.vo.SiteStatVO;
import com.rawchen.blog.vo.TrendVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * 统计控制器
 *
 * @author RawChen
 */
@Api(tags = "统计管理")
@RestController
@RequestMapping("/api/stat")
public class StatController {

    @Autowired
    private StatService statService;

    @ApiOperation("获取站点统计")
    @GetMapping("/site-stat")
    public R<SiteStatVO> getSiteStat() {
        return R.ok(statService.getSiteStat());
    }

    @ApiOperation("获取访问趋势")
    @GetMapping("/trend")
    public R<List<TrendVO>> getVisitTrend(
            @RequestParam(defaultValue = "7") Integer days) {
        return R.ok(statService.getVisitTrend(days));
    }

    @ApiOperation("记录PV")
    @PostMapping("/pv")
    public R<Void> recordPv(HttpServletRequest request) {
        String ip = getClientIp(request);
        statService.recordPv(ip);
        return R.ok();
    }

    @ApiOperation("获取热门文章")
    @GetMapping("/hot-articles")
    public R<List<Long>> getHotArticles(
            @RequestParam(defaultValue = "10") Integer limit) {
        return R.ok(statService.getHotArticles(limit));
    }

    @ApiOperation("获取热门标签")
    @GetMapping("/hot-tags")
    public R<List<Long>> getHotTags(
            @RequestParam(defaultValue = "10") Integer limit) {
        return R.ok(statService.getHotTags(limit));
    }

    // ========== 仪表盘统计接口 ==========

    @ApiOperation("获取仪表盘统计数据")
    @GetMapping("/dashboard/stats")
    public R<DashboardStatsVO> getDashboardStats() {
        return R.ok(statService.getDashboardStats());
    }

    @ApiOperation("获取30天访问趋势")
    @GetMapping("/dashboard/access-trend")
    public R<List<AccessTrendVO>> getAccessTrend() {
        return R.ok(statService.getAccessTrend());
    }

    @ApiOperation("获取热门文章排行")
    @GetMapping("/dashboard/top-articles")
    public R<List<ChartItemVO>> getTopArticles(
            @RequestParam(defaultValue = "10") Integer limit) {
        return R.ok(statService.getTopArticles(limit));
    }

    @ApiOperation("获取浏览器分布")
    @GetMapping("/dashboard/browser")
    public R<List<ChartItemVO>> getBrowserDistribution() {
        return R.ok(statService.getBrowserDistribution());
    }

    @ApiOperation("获取操作系统分布")
    @GetMapping("/dashboard/os")
    public R<List<ChartItemVO>> getOsDistribution() {
        return R.ok(statService.getOsDistribution());
    }

    @ApiOperation("获取省份分布")
    @GetMapping("/dashboard/province")
    public R<List<ChartItemVO>> getProvinceDistribution() {
        return R.ok(statService.getProvinceDistribution());
    }

    @ApiOperation("获取来源域名分布")
    @GetMapping("/dashboard/referer")
    public R<List<ChartItemVO>> getRefererDomainDistribution() {
        return R.ok(statService.getRefererDomainDistribution());
    }

    @ApiOperation("获取操作类型分布")
    @GetMapping("/dashboard/operation")
    public R<List<ChartItemVO>> getOperationDistribution() {
        return R.ok(statService.getOperationDistribution());
    }

    @ApiOperation("获取分类文章数统计")
    @GetMapping("/dashboard/category-articles")
    public R<List<ChartItemVO>> getCategoryArticleCount() {
        return R.ok(statService.getCategoryArticleCount());
    }

    @ApiOperation("获取标签文章数统计")
    @GetMapping("/dashboard/tag-articles")
    public R<List<ChartItemVO>> getTagArticleCount() {
        return R.ok(statService.getTagArticleCount());
    }

    @ApiOperation("获取访客国家分布")
    @GetMapping("/dashboard/country")
    public R<List<ChartItemVO>> getCountryDistribution() {
        return R.ok(statService.getCountryDistribution());
    }

    @ApiOperation("获取访客城市分布")
    @GetMapping("/dashboard/city")
    public R<List<Map<String, Object>>> getCityDistribution() {
        return R.ok(statService.getCityDistribution());
    }

    /**
     * 获取客户端IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}