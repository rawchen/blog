package com.rawchen.blog.service;

import com.rawchen.blog.dto.FriendLinkDTO;
import com.rawchen.blog.entity.FriendLink;
import com.rawchen.blog.vo.FriendLinkVO;

import java.util.List;

/**
 * 友链服务接口
 *
 * @author RawChen
 */
public interface FriendLinkService {

    /**
     * 获取友链列表（前台）
     */
    List<FriendLinkVO> getFriendLinkList();

    /**
     * 获取友链列表（后台）
     */
    List<FriendLinkVO> getFriendLinkListAdmin();

    /**
     * 根据ID获取友链
     */
    FriendLink getFriendLinkById(Long id);

    /**
     * 添加友链
     */
    Long addFriendLink(FriendLinkDTO dto);

    /**
     * 更新友链
     */
    void updateFriendLink(FriendLinkDTO dto);

    /**
     * 删除友链
     */
    void deleteFriendLink(Long id);

    /**
     * 检测友链状态
     */
    void checkFriendLinkStatus(Long id);
}