package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.service.StatService;
import com.rawchen.blog.vo.SiteStatVO;
import com.rawchen.blog.vo.TrendVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

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