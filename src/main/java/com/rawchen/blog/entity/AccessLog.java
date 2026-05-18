package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 访问日志实体
 *
 * @author RawChen
 */
@Data
@TableName("sys_access_log")
public class AccessLog implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 文章ID
     */
    private Long articleId;

    /**
     * 操作内容: HOME/ARTICLE/PAGE/CATEGORY/TAG等
     */
    private String operation;

    /**
     * IP地址
     */
    private String ipAddress;

    /**
     * 来源
     */
    private String referer;

    /**
     * 来源域名
     */
    private String refererDomain;

    /**
     * 浏览器 例如：Chrome
     */
    private String browser;

    /**
     * 浏览器版本 例如：116.0.1938.76
     */
    private String browserVersion;

    /**
     * 操作系统
     */
    private String os;

    /**
     * 操作系统版本 例如：6.0.1
     */
    private String osVersion;

    /**
     * 操作状态 0-失败 1-成功
     */
    private Integer status;

    /**
     * 错误消息
     */
    private String errorMsg;

    /**
     * 相对链接 例如：/755/comment-page-1?replyTo=387
     */
    private String relativeUrl;

    /**
     * 查询参数 例如：replyTo=387
     */
    private String queryString;

    /**
     * 是否是机器人 0-否 1-是
     */
    private Integer isRobot;

    /**
     * 机器人名称，例如：Googlebot
     */
    private String robot;

    /**
     * 机器人版本 例如：2.1
     */
    private String robotVersion;

    /**
     * 国家
     */
    private String country;

    /**
     * 省份
     */
    private String province;

    /**
     * 城市
     */
    private String city;

    /**
     * 运营商
     */
    private String isp;

    /**
     * 基于ip2region归属地完整描述
     * 例如：中国|广东省|东莞市|移动|CN 或者：United States|California|0|0|US
     */
    private String location;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}