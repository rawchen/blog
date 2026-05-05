package com.rawchen.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.rawchen.blog.entity.Comment;
import org.apache.ibatis.annotations.Mapper;

/**
 * 评论Mapper
 *
 * @author RawChen
 */
@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
}
