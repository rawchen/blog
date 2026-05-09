package com.rawchen.blog.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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
     * 获取友链分页列表（后台）
     */
    Page<FriendLinkVO> getFriendLinkPage(int page, int size);

    /**
     * 根据ID获取友链
     */
    FriendLink getFriendLinkById(Long id);

    /**
     * 添加友链
     */
    Long addFriendLink(FriendLinkDTO dto);

    /**
     * 申请友链（前台）
     */
    Long applyFriendLink(FriendLinkDTO dto);

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

    /**
     * 审核友链
     */
    void auditFriendLink(Long id, Integer status);
}
