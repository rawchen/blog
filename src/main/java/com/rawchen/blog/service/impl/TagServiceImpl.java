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

import java.util.List;
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

        return tags.stream()
                .map(this::convertToVO)
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

        List<TagVO> voList = tagPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(new Page<TagVO>()
                .setRecords(voList)
                .setCurrent(tagPage.getCurrent())
                .setSize(tagPage.getSize())
                .setTotal(tagPage.getTotal())
                .setPages(tagPage.getPages()));
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

    private TagVO convertToVO(Tag tag) {
        TagVO vo = new TagVO();
        BeanUtils.copyProperties(tag, vo);
        // 统计该标签下已发布文章数量
        Long count = articleTagMapper.countPublishedArticlesByTagId(tag.getId());
        vo.setArticleCount(count != null ? count.intValue() : 0);
        return vo;
    }
}
