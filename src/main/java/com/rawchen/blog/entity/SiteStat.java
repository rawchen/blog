package com.rawchen.blog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 站点统计实体
 *
 * @author RawChen
 */
@Data
@TableName("blog_site_stat")
public class SiteStat implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 统计日期
     */
    private LocalDate statDate;

    /**
     * 页面浏览量
     */
    private Integer pvCount;

    /**
     * 独立访客数
     */
    private Integer uvCount;

    /**
     * 独立IP数
     */
    private Integer ipCount;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
