package com.rawchen.blog.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.entity.Tag;
import com.rawchen.blog.vo.TagVO;

import java.util.List;

/**
 * 标签服务接口
 *
 * @author RawChen
 */
public interface TagService {

    /**
     * 获取所有标签列表
     */
    List<TagVO> getTagList();

    /**
     * 分页查询标签列表
     */
    PageResult<TagVO> getTagListPage(Long current, Long size, String keyword);

    /**
     * 根据ID获取标签
     */
    Tag getTagById(Long id);

    /**
     * 创建标签
     */
    Long createTag(Tag tag);

    /**
     * 更新标签
     */
    void updateTag(Tag tag);

    /**
     * 删除标签
     */
    void deleteTag(Long id);
}
