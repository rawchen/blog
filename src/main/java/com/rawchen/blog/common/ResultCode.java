package com.rawchen.blog.common;

import lombok.Getter;

/**
 * 返回状态码
 *
 * @author RawChen
 */
@Getter
public enum ResultCode {

    // 成功
    SUCCESS(200, "操作成功"),

    // 客户端错误 4xx
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权"),
    FORBIDDEN(403, "无权限访问"),
    NOT_FOUND(404, "资源不存在"),
    METHOD_NOT_ALLOWED(405, "请求方法不允许"),
    PARAM_VALID_ERROR(422, "参数验证失败"),

    // 服务端错误 5xx
    INTERNAL_SERVER_ERROR(500, "服务器内部错误"),
    SERVICE_UNAVAILABLE(503, "服务不可用"),

    // 业务错误 1xxx
    USER_NOT_FOUND(1001, "用户不存在"),
    USER_PASSWORD_ERROR(1002, "密码错误"),
    USER_DISABLED(1003, "用户已被禁用"),
    USER_EXISTED(1004, "用户已存在"),
    EMAIL_EXISTED(1005, "邮箱已被注册"),
    
    TOKEN_INVALID(1101, "Token无效"),
    TOKEN_EXPIRED(1102, "Token已过期"),
    REFRESH_TOKEN_INVALID(1103, "RefreshToken无效"),

    ARTICLE_NOT_FOUND(1201, "文章不存在"),
    CATEGORY_NOT_FOUND(1202, "分类不存在"),
    TAG_NOT_FOUND(1203, "标签不存在"),
    COMMENT_NOT_FOUND(1204, "评论不存在"),

    PERMISSION_DENIED(1301, "权限不足"),
    ROLE_NOT_FOUND(1302, "角色不存在"),

    // 数据操作错误 2xxx
    DATA_INSERT_ERROR(2001, "数据插入失败"),
    DATA_UPDATE_ERROR(2002, "数据更新失败"),
    DATA_DELETE_ERROR(2003, "数据删除失败"),
    DATA_EXISTED(2004, "数据已存在");

    private final Integer code;
    private final String message;

    ResultCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
