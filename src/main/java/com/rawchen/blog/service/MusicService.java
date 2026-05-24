package com.rawchen.blog.service;

import com.rawchen.blog.vo.MusicLyricVO;
import com.rawchen.blog.vo.MusicUrlVO;
import com.rawchen.blog.vo.MusicVO;

import java.util.List;

/**
 * 音乐服务接口
 *
 * @author RawChen
 */
public interface MusicService {

    /**
     * 搜索歌曲
     *
     * @param keyword 关键词
     * @param limit   限制数量
     * @return 歌曲列表
     */
    List<MusicVO> search(String keyword, Integer limit);

    /**
     * 获取歌曲详情
     *
     * @param id 歌曲ID
     * @return 歌曲信息
     */
    MusicVO song(String id);

    /**
     * 获取歌曲播放链接
     *
     * @param id 歌曲ID
     * @param br 码率
     * @return 播放链接
     */
    MusicUrlVO url(String id, Integer br);

    /**
     * 获取歌词
     *
     * @param id 歌曲ID
     * @return 歌词
     */
    MusicLyricVO lyric(String id);

    /**
     * 获取歌单
     *
     * @param id 歌单ID
     * @return 歌曲列表
     */
    List<MusicVO> playlist(String id);

    /**
     * 获取专辑
     *
     * @param id 专辑ID
     * @return 歌曲列表
     */
    List<MusicVO> album(String id);

    /**
     * 获取艺术家热门歌曲
     *
     * @param id    艺术家ID
     * @param limit 限制数量
     * @return 歌曲列表
     */
    List<MusicVO> artist(String id, Integer limit);
}