package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 音乐歌词VO
 *
 * @author RawChen
 */
@Data
public class MusicLyricVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 原文歌词
     */
    private String lyric;

    /**
     * 翻译歌词
     */
    private String tlyric;
}