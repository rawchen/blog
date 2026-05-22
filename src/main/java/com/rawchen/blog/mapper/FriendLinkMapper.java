package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.FriendLink;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 友链Mapper
 *
 * @author RawChen
 */
@Mapper
public interface FriendLinkMapper extends BaseMapper<FriendLink> {

    /**
     * 查询最大的sortOrder
     */
    @Select("SELECT MAX(sort_order) FROM blog_friend_link WHERE is_deleted = 0")
    Integer selectMaxSortOrder();
}