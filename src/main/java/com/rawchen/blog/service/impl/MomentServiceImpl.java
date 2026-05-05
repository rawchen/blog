package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.rawchen.blog.common.PageResult;
import com.rawchen.blog.dto.MomentDTO;
import com.rawchen.blog.entity.Moment;
import com.rawchen.blog.exception.BusinessException;
import com.rawchen.blog.mapper.MomentMapper;
import com.rawchen.blog.service.MomentService;
import com.rawchen.blog.vo.MomentVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 朋友圈服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class MomentServiceImpl implements MomentService {

    @Autowired
    private MomentMapper momentMapper;

    @Override
    public PageResult<MomentVO> getMomentList(Long current, Long size) {
        Page<Moment> page = new Page<>(current, size);

        LambdaQueryWrapper<Moment> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Moment::getPublishTime);

        Page<Moment> momentPage = momentMapper.selectPage(page, wrapper);

        List<MomentVO> voList = momentPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(new Page<MomentVO>()
                .setRecords(voList)
                .setCurrent(momentPage.getCurrent())
                .setSize(momentPage.getSize())
                .setTotal(momentPage.getTotal())
                .setPages(momentPage.getPages()));
    }

    @Override
    public Moment getMomentById(Long id) {
        Moment moment = momentMapper.selectById(id);
        if (moment == null) {
            throw new BusinessException("动态不存在");
        }
        return moment;
    }

    @Override
    public Long addMoment(MomentDTO dto) {
        Moment moment = new Moment();
        BeanUtils.copyProperties(dto, moment);

        momentMapper.insert(moment);
        log.info("添加动态成功: {}", moment.getTitle());

        return moment.getId();
    }

    @Override
    public void fetchFromRss(String rssUrl) {
        // RSS订阅拉取功能，可以后续实现
        // 这里需要引入RSS解析库
        log.info("从RSS订阅拉取: {}", rssUrl);
        throw new BusinessException("RSS订阅功能暂未实现");
    }

    @Override
    public void deleteMoment(Long id) {
        momentMapper.deleteById(id);
        log.info("删除动态成功: {}", id);
    }

    private MomentVO convertToVO(Moment moment) {
        MomentVO vo = new MomentVO();
        BeanUtils.copyProperties(moment, vo);
        return vo;
    }
}