package com.rawchen.blog.controller;

import cn.hutool.core.util.StrUtil;
import com.rawchen.blog.common.R;
import com.rawchen.blog.service.MusicService;
import com.rawchen.blog.vo.MusicLyricVO;
import com.rawchen.blog.vo.MusicUrlVO;
import com.rawchen.blog.vo.MusicVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
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

    /**
     * 音频下载时使用的 UA / Referer（网易云 CDN 有防盗链校验）
     */
    private static final String DOWNLOAD_USER_AGENT =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    private static final String DOWNLOAD_REFERER = "https://music.163.com/";

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
        convertUrlToHttps(vo);
        return R.ok(vo);
    }

    @ApiOperation("获取歌曲播放链接")
    @GetMapping("/url/{id}")
    public R<MusicUrlVO> url(
            @PathVariable String id,
            @RequestParam(defaultValue = "320") Integer br) {
        MusicUrlVO vo = musicService.url(id, br);
        if (vo != null && vo.getUrl() != null && vo.getUrl().startsWith("http://")) {
            vo.setUrl(vo.getUrl().replace("http://", "https://"));
        }
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
     * 将 MusicVO 中的 url 字段从 http 替换为 https
     */
    private void convertUrlToHttps(MusicVO vo) {
        if (vo != null && vo.getUrl() != null && vo.getUrl().startsWith("http://")) {
            vo.setUrl(vo.getUrl().replace("http://", "https://"));
        }
    }

    /**
     * 歌曲下载
     *
     * 前端直接拿到的是网易云 CDN 地址，跨域且无法控制文件名，
     * 这里由服务端代理转发音频流，并以附件形式返回，
     * 对外表现为「点击即可下载 mp3」。
     *
     * @param id   歌曲ID
     * @param br   码率（kbps），默认 320
     * @param name 文件名（不含扩展名），为空时使用歌曲ID
     */
    @ApiOperation("下载歌曲")
    @GetMapping("/download/{id}")
    public ResponseEntity<StreamingResponseBody> download(
            @PathVariable String id,
            @RequestParam(defaultValue = "320") Integer br,
            @RequestParam(required = false) String name) {

        MusicUrlVO urlVo = musicService.url(id, br);
        if (urlVo == null || StrUtil.isBlank(urlVo.getUrl())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String audioUrl = urlVo.getUrl().replace("http://", "https://");
        String fileName = buildDownloadFileName(name, id);

        StreamingResponseBody body = outputStream -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(audioUrl).openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(60000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", DOWNLOAD_USER_AGENT);
                connection.setRequestProperty("Referer", DOWNLOAD_REFERER);

                int responseCode = connection.getResponseCode();
                if (responseCode != HttpURLConnection.HTTP_OK) {
                    throw new IOException("音频拉取失败: " + responseCode);
                }

                try (InputStream inputStream = connection.getInputStream()) {
                    byte[] buffer = new byte[8192];
                    int length;
                    while ((length = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, length);
                    }
                    outputStream.flush();
                }
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        };

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(fileName, StandardCharsets.UTF_8)
                .build());
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setCacheControl("no-store");

        return ResponseEntity.ok().headers(headers).body(body);
    }

    /**
     * 构造下载文件名：过滤非法字符并补上 mp3 扩展名
     */
    private String buildDownloadFileName(String name, String id) {
        String safeName = name == null ? "" : name.trim();
        safeName = safeName.replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_");
        if (StrUtil.isBlank(safeName)) {
            safeName = "music-" + id;
        }
        if (safeName.length() > 80) {
            safeName = safeName.substring(0, 80);
        }
        if (!safeName.toLowerCase().endsWith(".mp3")) {
            safeName = safeName + ".mp3";
        }
        return safeName;
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
                convertUrlToHttps(song);
                return song;
            case "playlist":
                List<MusicVO> playlist = musicService.playlist(id);
                playlist.forEach(this::convertUrlToHttps);
                return playlist;
            case "album":
                List<MusicVO> album = musicService.album(id);
                album.forEach(this::convertUrlToHttps);
                return album;
            case "artist":
                List<MusicVO> artist = musicService.artist(id, 50);
                artist.forEach(this::convertUrlToHttps);
                return artist;
            case "name":
                // name 类型用于搜索
                List<MusicVO> search = musicService.search(id, 30);
                search.forEach(this::convertUrlToHttps);
                return search;
            case "url":
                MusicUrlVO url = musicService.url(id, 320);
                if (url != null && url.getUrl() != null && url.getUrl().startsWith("http://")) {
                    url.setUrl(url.getUrl().replace("http://", "https://"));
                }
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