package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.entity.Tag;
import com.rawchen.blog.mapper.ArticleTagMapper;
import com.rawchen.blog.mapper.TagMapper;
import com.rawchen.blog.service.TagService;
import com.rawchen.blog.vo.TagVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 标签服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class TagServiceImpl implements TagService {

    @Autowired
    private TagMapper tagMapper;

    @Autowired
    private ArticleTagMapper articleTagMapper;

    @Override
    public List<TagVO> getTagList() {
        List<Tag> tags = tagMapper.selectList(new LambdaQueryWrapper<Tag>()
                .eq(Tag::getStatus, 1)
                .orderByDesc(Tag::getArticleCount));

        // 批量查询文章数量
        Map<Long, Long> articleCountMap = getArticleCountMap();

        return tags.stream()
                .map(tag -> convertToVOWithCount(tag, articleCountMap))
                .collect(Collectors.toList());
    }

    @Override
    public PageResult<TagVO> getTagListPage(Long current, Long size, String keyword) {
        Page<Tag> page = new Page<>(current, size);

        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Tag::getTagName, keyword);
        }
        wrapper.orderByDesc(Tag::getCreateTime);

        Page<Tag> tagPage = tagMapper.selectPage(page, wrapper);

        // 批量查询文章数量
        Map<Long, Long> articleCountMap = getArticleCountMap();

        List<TagVO> voList = tagPage.getRecords().stream()
                .map(tag -> convertToVOWithCount(tag, articleCountMap))
                .collect(Collectors.toList());

        return PageResult.of(new Page<TagVO>()
                .setRecords(voList)
                .setCurrent(tagPage.getCurrent())
                .setSize(tagPage.getSize())
                .setTotal(tagPage.getTotal())
                .setPages(tagPage.getPages()));
    }

    /**
     * 批量获取标签文章数量
     */
    private Map<Long, Long> getArticleCountMap() {
        Map<Long, Long> result = new HashMap<>();
        List<Map<String, Object>> counts = articleTagMapper.countPublishedArticlesByTagIds();
        for (Map<String, Object> item : counts) {
            Long tagId = ((Number) item.get("tag_id")).longValue();
            Long count = ((Number) item.get("article_count")).longValue();
            result.put(tagId, count);
        }
        return result;
    }

    /**
     * 使用缓存的Map转换为VO
     */
    private TagVO convertToVOWithCount(Tag tag, Map<Long, Long> articleCountMap) {
        TagVO vo = new TagVO();
        BeanUtils.copyProperties(tag, vo);
        // 从Map获取文章数量
        Long count = articleCountMap.getOrDefault(tag.getId(), 0L);
        vo.setArticleCount(count.intValue());
        return vo;
    }

    @Override
    public Tag getTagById(Long id) {
        return tagMapper.selectById(id);
    }

    @Override
    public Long createTag(Tag tag) {
        tag.setArticleCount(0);
        tagMapper.insert(tag);
        log.info("创建标签成功: {}", tag.getTagName());
        return tag.getId();
    }

    @Override
    public void updateTag(Tag tag) {
        tagMapper.updateById(tag);
        log.info("更新标签成功: {}", tag.getTagName());
    }

    @Override
    public void deleteTag(Long id) {
        tagMapper.deleteById(id);
        log.info("删除标签成功: {}", id);
    }
}
