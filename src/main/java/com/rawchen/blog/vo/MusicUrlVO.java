package com.rawchen.blog.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 音乐播放链接VO
 *
 * @author RawChen
 */
@Data
public class MusicUrlVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 播放链接
     */
    private String url;

    /**
     * 文件大小 (字节)
     */
    private Long size;

    /**
     * 码率 (kbps)
     */
    private Integer br;
}