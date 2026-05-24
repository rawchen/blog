package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 音乐信息VO
 * 兼容 Meting API 返回格式
 *
 * @author RawChen
 */
@Data
public class MusicVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 歌曲ID
     */
    private String id;

    /**
     * 歌曲名称
     */
    private String name;

    /**
     * 歌手名称
     */
    private String artist;

    /**
     * 专辑名称
     */
    private String album;

    /**
     * 封面图片URL
     */
    private String pic;

    /**
     * 播放链接
     */
    private String url;

    /**
     * 歌词链接
     */
    private String lrc;

    /**
     * 数据来源
     */
    private String source;

    /**
     * 类型 (song/playlist)
     */
    private String type;

    public MusicVO() {
        this.source = "netease";
        this.type = "song";
    }
}