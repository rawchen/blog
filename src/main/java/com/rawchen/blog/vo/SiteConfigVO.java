package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 站点配置VO（公开）
 *
 * @author RawChen
 */
@Data
public class SiteConfigVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 站点名称
     */
    private String siteName;

    /**
     * 站点描述
     */
    private String siteDescription;

    /**
     * 站点关键词
     */
    private String siteKeywords;

    /**
     * 站点Logo
     */
    private String siteLogo;

    /**
     * 页脚Logo
     */
    private String siteFooterLogo;

    /**
     * 站点Favicon
     */
    private String siteFavicon;

    /**
     * 页脚信息
     */
    private String footerInfo;

    /**
     * 备案号
     */
    private String siteIcp;

    /**
     * GitHub链接
     */
    private String githubUrl;

    /**
     * 电报链接
     */
    private String telegramUrl;

    /**
     * 微博链接
     */
    private String weiboUrl;

    /**
     * 知乎链接
     */
    private String zhihuUrl;

    /**
     * 推特链接
     */
    private String twitterUrl;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 微信二维码
     */
    private String wechatQrcode;

    /**
     * QQ号
     */
    private String qqNumber;

    /**
     * 统计链接
     */
    private String statsUrl;

    /**
     * 跟踪代码
     */
    private String trackingCode;

    /**
     * 是否开启OSS
     */
    private Boolean ossEnabled;

    /**
     * OSS图片处理样式
     */
    private String ossStyle;

    /**
     * Gravatar头像域名
     */
    private String gravatarDomain;
}
