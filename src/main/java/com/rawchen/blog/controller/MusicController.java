package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.service.MusicService;
import com.rawchen.blog.vo.MusicLyricVO;
import com.rawchen.blog.vo.MusicUrlVO;
import com.rawchen.blog.vo.MusicVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * 音乐控制器
 * 提供网易云音乐 API 接口
 *
 * @author RawChen
 */
@Api(tags = "音乐接口")
@RestController
@RequestMapping("/api/music")
public class MusicController {

    @Autowired
    private MusicService musicService;

    @ApiOperation("搜索歌曲")
    @GetMapping("/search")
    public R<List<MusicVO>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "30") Integer limit) {
        List<MusicVO> list = musicService.search(keyword, limit);
        return R.ok(list);
    }

    @ApiOperation("获取歌曲详情")
    @GetMapping("/song/{id}")
    public R<MusicVO> song(@PathVariable String id) {
        MusicVO vo = musicService.song(id);
        if (vo == null) {
            return R.fail("未找到歌曲");
        }
        return R.ok(vo);
    }

    @ApiOperation("获取歌曲播放链接")
    @GetMapping("/url/{id}")
    public R<MusicUrlVO> url(
            @PathVariable String id,
            @RequestParam(defaultValue = "320") Integer br) {
        MusicUrlVO vo = musicService.url(id, br);
        return R.ok(vo);
    }

    @ApiOperation("获取歌词")
    @GetMapping("/lyric/{id}")
    public R<MusicLyricVO> lyric(@PathVariable String id) {
        MusicLyricVO vo = musicService.lyric(id);
        return R.ok(vo);
    }

    @ApiOperation("获取歌词(纯文本)")
    @GetMapping(value = "/lyric/{id}/text", produces = "text/plain;charset=UTF-8")
    @ResponseBody
    public String lyricText(@PathVariable String id) {
        MusicLyricVO vo = musicService.lyric(id);
        if (vo != null && vo.getLyric() != null) {
            return vo.getLyric();
        }
        return "";
    }

    @ApiOperation("获取歌单")
    @GetMapping("/playlist/{id}")
    public R<List<MusicVO>> playlist(@PathVariable String id) {
        List<MusicVO> list = musicService.playlist(id);
        return R.ok(list);
    }

    @ApiOperation("获取专辑")
    @GetMapping("/album/{id}")
    public R<List<MusicVO>> album(@PathVariable String id) {
        List<MusicVO> list = musicService.album(id);
        return R.ok(list);
    }

    @ApiOperation("获取艺术家热门歌曲")
    @GetMapping("/artist/{id}")
    public R<List<MusicVO>> artist(
            @PathVariable String id,
            @RequestParam(defaultValue = "50") Integer limit) {
        List<MusicVO> list = musicService.artist(id, limit);
        return R.ok(list);
    }

    /**
     * 兼容 Meting API 格式
     * 返回格式与 api.injahow.cn/meting 保持一致，便于前端平滑切换
     */
    @ApiOperation("Meting兼容接口")
    @GetMapping("/meting")
    public Object meting(
            @RequestParam String type,
            @RequestParam String id) {
        switch (type) {
            case "song":
                MusicVO song = musicService.song(id);
                if (song == null) {
                    return Collections.emptyList();
                }
                return song;
            case "playlist":
                List<MusicVO> playlist = musicService.playlist(id);
                return playlist;
            case "album":
                List<MusicVO> album = musicService.album(id);
                return album;
            case "artist":
                List<MusicVO> artist = musicService.artist(id, 50);
                return artist;
            case "name":
                // name 类型用于搜索
                return musicService.search(id, 30);
            case "url":
                MusicUrlVO url = musicService.url(id, 320);
                return url;
            case "lrc":
            case "lyric":
                MusicLyricVO lyric = musicService.lyric(id);
                return lyric;
            default:
                return Collections.emptyList();
        }
    }
}