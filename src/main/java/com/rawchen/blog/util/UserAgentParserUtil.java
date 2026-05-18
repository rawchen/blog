package com.rawchen.blog.util;

import cn.hutool.http.useragent.UserAgent;
import cn.hutool.http.useragent.UserAgentUtil;
import lombok.Data;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * UserAgent解析工具类
 * 基于Hutool的UserAgentUtil实现
 *
 * @author RawChen
 */
public class UserAgentParserUtil {

    /**
     * 匹配bot/spider的正则表达式
     * 格式：名称 + bot/spider + 版本号
     */
    private static final Pattern ROBOT_PATTERN = Pattern.compile("([a-zA-Z0-9]+\\s*(?:bot|spider))[ /v]*([0-9.]*)", Pattern.CASE_INSENSITIVE);

    /**
     * 常见机器人关键词列表（用于补充正则未匹配的情况）
     */
    private static final List<String> ROBOT_KEYWORDS = Arrays.asList(
            // Google
            "googlebot", "googleadsense", "google favicon", "gce-spider",
            // 百度
            "baiduspider", "baidugame",
            // Bing
            "bingbot", "msnbot", "msiecrawler",
            // Yandex
            "yandexbot", "yandex",
            // DuckDuckGo
            "duckduckbot", "duckduckgo-favicons-bot",
            // 搜狗
            "sogou", "sogou web spider", "sogou spider",
            // 其他搜索引擎
            "sosospider", "yisouspider", "youdaobot", "twiceler",
            // 社交媒体
            "facebookexternalhit", "twitterbot", "linkedinbot", "pinterestbot",
            // Yahoo
            "yahoo! slurp", "yahoo slurp", "slurp",
            // Alexa/Internet Archive
            "ia_archiver", "ia archiver",
            // 监控检测
            "uptimerobot", "netcraft", "speedy spider",
            // 爬虫框架
            "heritrix", "nutch", "larbin", "stackrambler", "yacy",
            // 编程语言/工具
            "python", "java (often spam bot)", "perl tool", "lwp-trivial",
            // HTTP客户端
            "curl", "wget", "httpclient", "okhttp",
            // 通用关键词
            "crawler", "robot", "surveybot",
            // 其他
            "exabot", "custo", "outfoxbot", "yodao", "legs",
            "voila", "bspider", "ask", "fish search", "mj12bot",
            "tencenttraveler", "mediapartners-google", "adsbot"
    );

    /**
     * 解析UserAgent信息
     *
     * @param userAgentString UserAgent字符串
     * @return 解析结果
     */
    public static UserAgentInfo parse(String userAgentString) {
        UserAgentInfo info = new UserAgentInfo();

        if (userAgentString == null || userAgentString.isEmpty()) {
            return info;
        }

        try {
            UserAgent userAgent = UserAgentUtil.parse(userAgentString);

            // 浏览器信息
            info.setBrowser(userAgent.getBrowser() != null ? userAgent.getBrowser().getName() : null);
            info.setBrowserVersion(userAgent.getVersion());

            // 操作系统信息
            info.setOs(userAgent.getOs() != null ? userAgent.getOs().getName() : null);
            info.setOsVersion(userAgent.getOsVersion());

            // 机器人检测 - 优先使用正则匹配
            Matcher matcher = ROBOT_PATTERN.matcher(userAgentString);
            if (matcher.find()) {
                info.setIsRobot(1);
                info.setRobot(matcher.group(1).trim());
                String version = matcher.group(2);
                info.setRobotVersion(version != null && !version.isEmpty() ? version : null);
            } else {
                // 正则未匹配，使用关键词匹配
                String lowerUA = userAgentString.toLowerCase();
                boolean isRobot = ROBOT_KEYWORDS.stream().anyMatch(lowerUA::contains);
                if (isRobot) {
                    info.setIsRobot(1);
                    info.setRobot(detectRobotName(userAgentString));
                    info.setRobotVersion(userAgent.getVersion());
                } else {
                    info.setIsRobot(0);
                }
            }

            // 平台信息
            info.setPlatform(userAgent.getPlatform() != null ? userAgent.getPlatform().getName() : null);

            // 引擎信息
            info.setEngine(userAgent.getEngine() != null ? userAgent.getEngine().getName() : null);
            info.setEngineVersion(userAgent.getEngineVersion());

        } catch (Exception e) {
            // 解析失败，返回空信息
        }

        return info;
    }

    /**
     * 检测机器人名称
     */
    private static String detectRobotName(String userAgentString) {
        String lowerUA = userAgentString.toLowerCase();

        if (lowerUA.contains("googlebot")) return "Googlebot";
        if (lowerUA.contains("gce-spider")) return "Google GCE Spider";
        if (lowerUA.contains("googleadsense") || lowerUA.contains("mediapartners-google")) return "Google AdSense";
        if (lowerUA.contains("baiduspider")) return "Baiduspider";
        if (lowerUA.contains("baidugame")) return "BaiduGame";
        if (lowerUA.contains("bingbot")) return "Bingbot";
        if (lowerUA.contains("msnbot")) return "MSNBot";
        if (lowerUA.contains("yandexbot")) return "YandexBot";
        if (lowerUA.contains("duckduckbot")) return "DuckDuckBot";
        if (lowerUA.contains("duckduckgo-favicons-bot")) return "DuckDuckGo-Favicons-Bot";
        if (lowerUA.contains("sogou")) return "Sogou Spider";
        if (lowerUA.contains("sosospider")) return "Sosospider";
        if (lowerUA.contains("yisouspider")) return "YisouSpider";
        if (lowerUA.contains("youdaobot") || lowerUA.contains("outfoxbot")) return "YoudaoBot";
        if (lowerUA.contains("facebookexternalhit")) return "FacebookBot";
        if (lowerUA.contains("twitterbot")) return "TwitterBot";
        if (lowerUA.contains("linkedinbot")) return "LinkedInBot";
        if (lowerUA.contains("pinterestbot")) return "PinterestBot";
        if (lowerUA.contains("slurp")) return "Yahoo Slurp";
        if (lowerUA.contains("ia_archiver")) return "Alexa (IA Archiver)";
        if (lowerUA.contains("uptimerobot")) return "UptimeRobot";
        if (lowerUA.contains("tencenttraveler")) return "TencentTraveler";
        if (lowerUA.contains("heritrix")) return "Heritrix";
        if (lowerUA.contains("nutch")) return "Nutch";
        if (lowerUA.contains("curl")) return "Curl";
        if (lowerUA.contains("wget")) return "Wget";
        if (lowerUA.contains("python")) return "Python";
        if (lowerUA.contains("java")) return "Java";
        if (lowerUA.contains("netcraft")) return "Netcraft";

        return "Unknown Robot";
    }

    /**
     * 获取浏览器名称
     */
    public static String getBrowser(String userAgentString) {
        return parse(userAgentString).getBrowser();
    }

    /**
     * 获取浏览器版本
     */
    public static String getBrowserVersion(String userAgentString) {
        return parse(userAgentString).getBrowserVersion();
    }

    /**
     * 获取操作系统名称
     */
    public static String getOs(String userAgentString) {
        return parse(userAgentString).getOs();
    }

    /**
     * 获取操作系统版本
     */
    public static String getOsVersion(String userAgentString) {
        return parse(userAgentString).getOsVersion();
    }

    /**
     * 判断是否为机器人
     */
    public static boolean isRobot(String userAgentString) {
        return parse(userAgentString).getIsRobot() == 1;
    }

    /**
     * UserAgent解析结果
     */
    @Data
    public static class UserAgentInfo {
        /**
         * 浏览器名称
         */
        private String browser;

        /**
         * 浏览器版本
         */
        private String browserVersion;

        /**
         * 操作系统
         */
        private String os;

        /**
         * 操作系统版本
         */
        private String osVersion;

        /**
         * 是否是机器人 0-否 1-是
         */
        private Integer isRobot = 0;

        /**
         * 机器人名称
         */
        private String robot;

        /**
         * 机器人版本
         */
        private String robotVersion;

        /**
         * 平台
         */
        private String platform;

        /**
         * 引擎
         */
        private String engine;

        /**
         * 引擎版本
         */
        private String engineVersion;
    }
}