package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.entity.Article;
import com.rawchen.blog.entity.SiteStat;
import com.rawchen.blog.mapper.*;
import com.rawchen.blog.service.StatService;
import com.rawchen.blog.vo.SiteStatVO;
import com.rawchen.blog.vo.TrendVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 统计服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class StatServiceImpl implements StatService {

    @Autowired
    private ArticleMapper articleMapper;

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private TagMapper tagMapper;

    @Autowired
    private SiteStatMapper siteStatMapper;

    @Override
    public SiteStatVO getSiteStat() {
        SiteStatVO vo = new SiteStatVO();

        // 文章总数
        Long articleCount = articleMapper.selectCount(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1));
        vo.setArticleCount(articleCount);

        // 评论总数
        Long commentCount = commentMapper.selectCount(null);
        vo.setCommentCount(commentCount);

        // 分类总数
        Long categoryCount = categoryMapper.selectCount(null);
        vo.setCategoryCount(categoryCount);

        // 标签总数
        Long tagCount = tagMapper.selectCount(null);
        vo.setTagCount(tagCount);

        // 总浏览量
        Long totalViewCount = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1))
                .stream()
                .mapToLong(a -> a.getViewCount() != null ? a.getViewCount() : 0)
                .sum();
        vo.setTotalViewCount(totalViewCount);

        // 总点赞量
        Long totalLikeCount = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1))
                .stream()
                .mapToLong(a -> a.getLikeCount() != null ? a.getLikeCount() : 0)
                .sum();
        vo.setTotalLikeCount(totalLikeCount);

        // 今日统计
        SiteStat todayStat = siteStatMapper.getByDate(LocalDate.now());
        if (todayStat != null) {
            vo.setTodayPv(todayStat.getPvCount());
            vo.setTodayUv(todayStat.getUvCount());
        } else {
            vo.setTodayPv(0);
            vo.setTodayUv(0);
        }

        return vo;
    }

    @Override
    public List<TrendVO> getVisitTrend(Integer days) {
        if (days == null || days <= 0) {
            days = 7;
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<SiteStat> stats = siteStatMapper.getByDateRange(startDate, endDate);

        return stats.stream().map(stat -> {
            TrendVO vo = new TrendVO();
            vo.setDate(stat.getStatDate());
            vo.setPvCount(stat.getPvCount());
            vo.setUvCount(stat.getUvCount());
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public void recordPv(String ip) {
        LocalDate today = LocalDate.now();
        SiteStat stat = siteStatMapper.selectOne(new LambdaQueryWrapper<SiteStat>()
                .eq(SiteStat::getStatDate, today));

        if (stat == null) {
            stat = new SiteStat();
            stat.setStatDate(today);
            stat.setPvCount(1);
            stat.setUvCount(1);
            stat.setIpCount(1);
            siteStatMapper.insert(stat);
        } else {
            stat.setPvCount(stat.getPvCount() + 1);
            siteStatMapper.updateById(stat);
        }
    }

    @Override
    public List<Long> getHotArticles(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 10;
        }

        List<Article> articles = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .eq(Article::getStatus, 1)
                .orderByDesc(Article::getViewCount)
                .last("LIMIT " + limit));

        return articles.stream()
                .map(Article::getId)
                .collect(Collectors.toList());
    }

    @Override
    public List<Long> getHotTags(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 10;
        }

        // 简单实现：返回最新标签
        return new ArrayList<>();
    }
}