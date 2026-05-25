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
     * 网站地址
     */
    private String siteUrl;

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
     * 打字机技能列表（逗号分隔）
     */
    private String skillList;

    /**
     * 是否开启打字机效果
     */
    private Boolean typewriterEnabled;

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

    /**
     * 是否开启评论审核
     */
    private Boolean commentEnabled;

    /**
     * 是否开启邮件通知
     */
    private Boolean mailEnabled;

    /**
     * 是否开启HTML渲染
     */
    private Boolean htmlRenderEnabled;

    /**
     * 是否开启文章打赏
     */
    private Boolean rewardEnabled;

    /**
     * 是否开启相关文章
     */
    private Boolean relatedPostsEnabled;

    /**
     * 文章分页大小
     */
    private Integer articlePageSize;

    /**
     * 历史累积PV
     */
    private String totalPv;

    /**
     * 历史累积UV
     */
    private String totalUv;

    /**
     * 站点创建日期
     */
    private String siteCreateDate;
}
