package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.SiteStat;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;

/**
 * 站点统计Mapper
 *
 * @author RawChen
 */
@Mapper
public interface SiteStatMapper extends BaseMapper<SiteStat> {

    @Select("SELECT SUM(pv_count) as pvCount, SUM(uv_count) as uvCount FROM blog_site_stat WHERE stat_date = #{date}")
    SiteStat getByDate(LocalDate date);

    @Select("SELECT * FROM blog_site_stat WHERE stat_date BETWEEN #{startDate} AND #{endDate} ORDER BY stat_date")
    List<SiteStat> getByDateRange(LocalDate startDate, LocalDate endDate);
}