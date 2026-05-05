package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.dto.FriendLinkDTO;
import com.rawchen.blog.entity.FriendLink;
import com.rawchen.blog.exception.BusinessException;
import com.rawchen.blog.mapper.FriendLinkMapper;
import com.rawchen.blog.service.FriendLinkService;
import com.rawchen.blog.vo.FriendLinkVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 友链服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class FriendLinkServiceImpl implements FriendLinkService {

    @Autowired
    private FriendLinkMapper friendLinkMapper;

    @Override
    public List<FriendLinkVO> getFriendLinkList() {
        List<FriendLink> list = friendLinkMapper.selectList(new LambdaQueryWrapper<FriendLink>()
                .eq(FriendLink::getStatus, 1)
                .orderByAsc(FriendLink::getSortOrder)
                .orderByDesc(FriendLink::getCreateTime));

        return list.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public List<FriendLinkVO> getFriendLinkListAdmin() {
        List<FriendLink> list = friendLinkMapper.selectList(new LambdaQueryWrapper<FriendLink>()
                .orderByAsc(FriendLink::getSortOrder)
                .orderByDesc(FriendLink::getCreateTime));

        return list.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public FriendLink getFriendLinkById(Long id) {
        FriendLink friendLink = friendLinkMapper.selectById(id);
        if (friendLink == null) {
            throw new BusinessException("友链不存在");
        }
        return friendLink;
    }

    @Override
    public Long addFriendLink(FriendLinkDTO dto) {
        FriendLink friendLink = new FriendLink();
        BeanUtils.copyProperties(dto, friendLink);

        if (friendLink.getStatus() == null) {
            friendLink.setStatus(1); // 默认正常
        }
        if (friendLink.getSortOrder() == null) {
            friendLink.setSortOrder(0);
        }

        friendLinkMapper.insert(friendLink);
        log.info("添加友链成功: {}", friendLink.getSiteName());

        return friendLink.getId();
    }

    @Override
    public void updateFriendLink(FriendLinkDTO dto) {
        FriendLink friendLink = friendLinkMapper.selectById(dto.getId());
        if (friendLink == null) {
            throw new BusinessException("友链不存在");
        }

        BeanUtils.copyProperties(dto, friendLink);
        friendLinkMapper.updateById(friendLink);
        log.info("更新友链成功: {}", friendLink.getSiteName());
    }

    @Override
    public void deleteFriendLink(Long id) {
        friendLinkMapper.deleteById(id);
        log.info("删除友链成功: {}", id);
    }

    @Override
    public void checkFriendLinkStatus(Long id) {
        FriendLink friendLink = friendLinkMapper.selectById(id);
        if (friendLink == null) {
            throw new BusinessException("友链不存在");
        }

        // 简单实现：这里可以添加实际的HTTP请求检测
        // 这里只做演示，实际需要发送HTTP请求检测网站是否可访问
        log.info("检测友链状态: {}", friendLink.getSiteUrl());
    }

    private FriendLinkVO convertToVO(FriendLink friendLink) {
        FriendLinkVO vo = new FriendLinkVO();
        BeanUtils.copyProperties(friendLink, vo);
        return vo;
    }
}