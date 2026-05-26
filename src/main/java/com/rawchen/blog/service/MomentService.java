package com.rawchen.blog.service;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.dto.MomentDTO;
import com.rawchen.blog.entity.Moment;
import com.rawchen.blog.vo.MomentVO;

import java.util.List;

/**
 * 朋友圈服务接口
 *
 * @author RawChen
 */
public interface MomentService extends IService<Moment> {

    /**
     * 获取朋友圈列表（前台）
     */
    PageResult<MomentVO> getMomentList(Long current, Long size);

    /**
     * 根据ID获取动态
     */
    Moment getMomentById(Long id);

    /**
     * 添加动态
     */
    Long addMoment(MomentDTO dto);

    /**
     * 从RSS订阅拉取
     */
    void fetchFromRss(String rssUrl);

    /**
     * 删除动态
     */
    void deleteMoment(Long id);

    /**
     * 批量保存动态
     */
//    void saveBatch(List<Moment> moments);
}