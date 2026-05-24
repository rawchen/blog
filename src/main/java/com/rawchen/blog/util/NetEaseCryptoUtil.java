package com.rawchen.blog.util;

import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.DigestUtil;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 网易云音乐 EAPI 加密工具类
 *
 * 参考: https://github.com/metowolf/Meting
 */
public class NetEaseCryptoUtil {

    /**
     * EAPI 加密密钥
     */
    private static final String EAPI_KEY = "e82ckenh8dichen8";

    /**
     * EAPI 加密
     *
     * @param urlPath URL路径 (如 /api/v3/song/detail/)
     * @param body    请求体JSON字符串
     * @return 加密后的params参数（已URL编码）
     */
    public static String eapiEncrypt(String urlPath, String body) {
        try {
            // 构建签名消息
            String message = "nobody" + urlPath + "use" + body + "md5forencrypt";
            // 计算MD5
            String digest = DigestUtil.md5Hex(message);
            // 构建待加密数据
            String data = urlPath + "-36cd479b6b5-" + body + "-36cd479b6b5-" + digest;

            // AES-128-ECB 加密
            SecretKeySpec keySpec = new SecretKeySpec(EAPI_KEY.getBytes(StandardCharsets.UTF_8), "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            byte[] encrypted = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));

            // 转换为十六进制字符串并大写
            String encryptedHex = bytesToHex(encrypted).toUpperCase();

            // URL编码
            return URLEncoder.encode(encryptedHex, StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            throw new RuntimeException("EAPI加密失败", e);
        }
    }

    /**
     * 字节数组转十六进制字符串
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * 网易云音乐歌曲ID加密 (用于图片URL)
     *
     * @param id 歌曲ID
     * @return 加密后的字符串
     */
    public static String encryptId(String id) {
        if (StrUtil.isBlank(id)) {
            return "";
        }
        String magic = "3go8&$8*3*3h0k(2)2";
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < id.length(); i++) {
            result.append((char) (id.charAt(i) ^ magic.charAt(i % magic.length())));
        }
        return DigestUtil.md5Hex(result.toString())
                .replace("+", "-")
                .replace("/", "_");
    }

    /**
     * 生成随机设备ID
     */
    public static String generateDeviceId() {
        return DigestUtil.md5Hex(String.valueOf(System.currentTimeMillis()) + Math.random())
                .substring(0, 32)
                .toUpperCase();
    }
}