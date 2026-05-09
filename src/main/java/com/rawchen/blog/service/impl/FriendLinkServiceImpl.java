package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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
                .orderByAsc(FriendLink::getCreateTime));

        return list.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public Page<FriendLinkVO> getFriendLinkPage(int page, int size) {
        Page<FriendLink> pageParam = new Page<>(page, size);
        // 待审核(status=0)优先，然后按创建时间倒序
        Page<FriendLink> result = friendLinkMapper.selectPage(pageParam, new LambdaQueryWrapper<FriendLink>()
                .orderByAsc(FriendLink::getStatus) // status 0(待审核) 排在最前
                .orderByDesc(FriendLink::getCreateTime));

        Page<FriendLinkVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::convertToVO).collect(Collectors.toList()));
        return voPage;
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
    public Long applyFriendLink(FriendLinkDTO dto) {
        FriendLink friendLink = new FriendLink();
        BeanUtils.copyProperties(dto, friendLink);

        friendLink.setStatus(0); // 待审核
        friendLink.setSortOrder(0);

        friendLinkMapper.insert(friendLink);
        log.info("申请友链成功: {}", friendLink.getSiteName());

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

    @Override
    public void auditFriendLink(Long id, Integer status) {
        FriendLink friendLink = friendLinkMapper.selectById(id);
        if (friendLink == null) {
            throw new BusinessException("友链不存在");
        }

        if (status != null && (status == 1 || status == 2)) {
            friendLink.setStatus(status);
            friendLinkMapper.updateById(friendLink);
            log.info("审核友链成功: id={}, status={}", id, status);
        } else {
            throw new BusinessException("审核状态无效");
        }
    }

    private FriendLinkVO convertToVO(FriendLink friendLink) {
        FriendLinkVO vo = new FriendLinkVO();
        BeanUtils.copyProperties(friendLink, vo);
        return vo;
    }
}
