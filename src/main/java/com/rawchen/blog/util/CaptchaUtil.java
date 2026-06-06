package com.rawchen.blog.util;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 加减法验证码工具类
 *
 * @author RawChen
 */
public class CaptchaUtil {

    private static final Map<String, Integer> captchaStore = new ConcurrentHashMap<>();
    private static final Random random = new Random();

    /**
     * 生成验证码
     *
     * @param sessionId 会话ID
     * @return 包含问题和sessionId的Map
     */
    public static Map<String, Object> generateCaptcha(String sessionId) {
        int num1 = random.nextInt(9) + 1;
        int num2 = random.nextInt(9) + 1;
        boolean isAddition = random.nextBoolean();

        int answer;
        String question;

        if (isAddition) {
            answer = num1 + num2;
            question = num1 + " + " + num2 + " = ?";
        } else {
            // 确保不出现负数结果
            if (num1 < num2) {
                int temp = num1;
                num1 = num2;
                num2 = temp;
            }
            answer = num1 - num2;
            question = num1 + " - " + num2 + " = ?";
        }

        captchaStore.put(sessionId, answer);

        Map<String, Object> result = new HashMap<>();
        result.put("question", question);
        result.put("sessionId", sessionId);

        return result;
    }

    /**
     * 验证验证码
     *
     * @param sessionId 会话ID
     * @param answer 用户答案
     * @return 是否正确
     */
    public static boolean validateCaptcha(String sessionId, int answer) {
        Integer storedAnswer = captchaStore.get(sessionId);
        if (storedAnswer == null) {
            return false;
        }

        boolean isValid = storedAnswer == answer;
        captchaStore.remove(sessionId); // 一次性使用
        return isValid;
    }

    /**
     * 检查验证码（不消耗）
     *
     * @param sessionId 会话ID
     * @param answer 用户答案
     * @return 是否正确
     */
    public static boolean checkCaptcha(String sessionId, int answer) {
        Integer storedAnswer = captchaStore.get(sessionId);
        if (storedAnswer == null) {
            return false;
        }
        return storedAnswer == answer;
    }

    /**
     * 移除验证码
     *
     * @param sessionId 会话ID
     */
    public static void removeCaptcha(String sessionId) {
        captchaStore.remove(sessionId);
    }
}
