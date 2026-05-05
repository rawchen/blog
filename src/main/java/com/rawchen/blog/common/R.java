package com.rawchen.blog.common;

import lombok.Data;

import java.io.Serializable;

/**
 * 统一返回结果
 *
 * @author RawChen
 */
@Data
public class R<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 状态码
     */
    private Integer code;

    /**
     * 返回消息
     */
    private String message;

    /**
     * 返回数据
     */
    private T data;

    /**
     * 时间戳
     */
    private Long timestamp;

    public R() {
        this.timestamp = System.currentTimeMillis();
    }

    public R(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }

    /**
     * 成功返回
     */
    public static <T> R<T> ok() {
        return new R<>(200, "success", null);
    }

    /**
     * 成功返回（带数据）
     */
    public static <T> R<T> ok(T data) {
        return new R<>(200, "success", data);
    }

    /**
     * 成功返回（带消息和数据）
     */
    public static <T> R<T> ok(String message, T data) {
        return new R<>(200, message, data);
    }

    /**
     * 失败返回
     */
    public static <T> R<T> fail() {
        return new R<>(500, "系统异常", null);
    }

    /**
     * 失败返回（带消息）
     */
    public static <T> R<T> fail(String message) {
        return new R<>(500, message, null);
    }

    /**
     * 失败返回（带状态码和消息）
     */
    public static <T> R<T> fail(Integer code, String message) {
        return new R<>(code, message, null);
    }

    /**
     * 失败返回（带状态码、消息和数据）
     */
    public static <T> R<T> fail(Integer code, String message, T data) {
        return new R<>(code, message, data);
    }

    /**
     * 根据结果码返回
     */
    public static <T> R<T> result(ResultCode resultCode) {
        return new R<>(resultCode.getCode(), resultCode.getMessage(), null);
    }

    /**
     * 根据结果码返回（带数据）
     */
    public static <T> R<T> result(ResultCode resultCode, T data) {
        return new R<>(resultCode.getCode(), resultCode.getMessage(), data);
    }
}
