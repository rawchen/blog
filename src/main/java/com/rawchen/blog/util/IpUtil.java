package com.rawchen.blog.util;

import lombok.extern.slf4j.Slf4j;
import org.lionsoul.ip2region.xdb.Searcher;
import org.lionsoul.ip2region.xdb.Version;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;

/**
 * IP地址解析工具类
 * 基于ip2region库实现
 *
 * @author RawChen
 */
@Slf4j
@Component
public class IpUtil {

    @Value("${ip2region.xdb}")
    private Resource xdbResource;

    private Searcher searcher;

    @PostConstruct
    public void init() {
        try {
            String dbPath = xdbResource.getFile().getAbsolutePath();
            log.info("ip2region数据库加载成功，路径: {}", dbPath);
            this.searcher = Searcher.newWithFileOnly(Version.IPv4, dbPath);
        } catch (Exception e) {
            log.error("ip2region数据库初始化失败: {}", e.getMessage());
        }
    }

    /**
     * 获取IP归属地信息
     *
     * @param ip IP地址
     * @return 归属地信息，格式：国家|省份|城市|ISP|国家代码
     */
    public String getRegion(String ip) {
        if (ip == null || ip.isEmpty()) {
            return "Unknown";
        }

        // 跳过本地地址
        if (isLocalIp(ip)) {
            return "本地|本地|本地|本地|LOCAL";
        }

        try {
            if (searcher == null) {
                return "Unknown";
            }
            return searcher.search(ip);
        } catch (Exception e) {
            log.error("IP解析失败: {}, 错误: {}", ip, e.getMessage());
            return "Unknown";
        }
    }

    /**
     * 解析IP地址归属地
     *
     * @param ip IP地址
     * @return 归属地信息数组：[country, province, city, isp, countryCode]
     */
    public String[] parseIp(String ip) {
        String region = getRegion(ip);
        if ("Unknown".equals(region) || region.startsWith("本地")) {
            return new String[]{"", "", "", "", ""};
        }

        // ip2region返回格式：国家|省份|城市|ISP|国家代码
        String[] parts = region.split("\\|");
        String country = parts.length > 0 ? formatPart(parts[0]) : "";
        String province = parts.length > 1 ? formatPart(parts[1]) : "";
        String city = parts.length > 2 ? formatPart(parts[2]) : "";
        String isp = parts.length > 3 ? formatPart(parts[3]) : "";
        String countryCode = parts.length > 4 ? parts[4] : "";

        return new String[]{country, province, city, isp, countryCode};
    }

    /**
     * 获取IP地址的完整归属地描述
     *
     * @param ip IP地址
     * @return 归属地描述
     */
    public String getLocation(String ip) {
        return getRegion(ip);
    }

    /**
     * 获取国家
     */
    public String getCountry(String ip) {
        return parseIp(ip)[0];
    }

    /**
     * 获取省份
     */
    public String getProvince(String ip) {
        return parseIp(ip)[1];
    }

    /**
     * 获取城市
     */
    public String getCity(String ip) {
        return parseIp(ip)[2];
    }

    /**
     * 获取运营商
     */
    public String getIsp(String ip) {
        return parseIp(ip)[3];
    }

    /**
     * 格式化部分信息，处理"0"值
     */
    private String formatPart(String part) {
        if (part == null || "0".equals(part) || part.isEmpty()) {
            return "";
        }
        return part;
    }

    /**
     * 判断是否为本地IP
     */
    private boolean isLocalIp(String ip) {
        return "127.0.0.1".equals(ip)
                || "0:0:0:0:0:0:0:1".equals(ip)
                || "::1".equals(ip)
                || ip.startsWith("192.168.")
                || ip.startsWith("10.")
                || ip.startsWith("172.16.")
                || ip.startsWith("172.17.")
                || ip.startsWith("172.18.")
                || ip.startsWith("172.19.")
                || ip.startsWith("172.20.")
                || ip.startsWith("172.21.")
                || ip.startsWith("172.22.")
                || ip.startsWith("172.23.")
                || ip.startsWith("172.24.")
                || ip.startsWith("172.25.")
                || ip.startsWith("172.26.")
                || ip.startsWith("172.27.")
                || ip.startsWith("172.28.")
                || ip.startsWith("172.29.")
                || ip.startsWith("172.30.")
                || ip.startsWith("172.31.")
                || "localhost".equalsIgnoreCase(ip);
    }

    /**
     * 获取客户端真实IP地址
     * 支持反向代理场景
     *
     * @param request HTTP请求
     * @return 客户端IP地址
     */
    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("CF-Connecting-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("True-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // 处理IPv6本地地址
        if ("0:0:0:0:0:0:0:1".equals(ip)) {
            ip = "127.0.0.1";
        }

        // 对于通过多个代理的情况，第一个IP才是客户端真实IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    /**
     * 获取请求来源Referer
     *
     * @param request HTTP请求
     * @return Referer
     */
    public static String getReferer(HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        return referer != null ? referer : "";
    }

    /**
     * 从Referer中提取域名
     *
     * @param referer Referer URL
     * @return 域名
     */
    public static String extractDomain(String referer) {
        if (referer == null || referer.isEmpty()) {
            return "";
        }
        try {
            java.net.URL url = new java.net.URL(referer);
            return url.getHost();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * 获取UserAgent
     *
     * @param request HTTP请求
     * @return UserAgent字符串
     */
    public static String getUserAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : "";
    }
}