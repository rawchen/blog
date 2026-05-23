package com.rawchen.blog.aspect;

import com.rawchen.blog.annotation.AccessLogAnnotation;
import com.rawchen.blog.entity.AccessLog;
import com.rawchen.blog.service.AccessLogService;
import com.rawchen.blog.util.IpUtil;
import com.rawchen.blog.util.UserAgentParserUtil;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;

/**
 * 访问日志切面
 *
 * @author RawChen
 */
@Slf4j
@Aspect
@Component
public class AccessLogAspect {

    @Autowired
    private AccessLogService accessLogService;

    @Autowired
    private IpUtil ipUtil;

    @Around("@annotation(accessLogAnnotation)")
    public Object around(ProceedingJoinPoint joinPoint, AccessLogAnnotation accessLogAnnotation) throws Throwable {
        // 执行方法
        Object result = null;
        Exception exception = null;

        try {
            result = joinPoint.proceed();
        } catch (Exception e) {
            exception = e;
            throw e;
        } finally {
            // 异步保存访问日志
            try {
                saveAccessLogAsync(joinPoint, accessLogAnnotation, result, exception);
            } catch (Exception e) {
                log.error("保存访问日志失败", e);
            }
        }

        return result;
    }

    /**
     * 异步保存访问日志
     */
    private void saveAccessLogAsync(ProceedingJoinPoint joinPoint, AccessLogAnnotation accessLogAnnotation, Object result, Exception exception) {
        // 获取当前请求
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return;
        }

        HttpServletRequest request = attributes.getRequest();

        // 获取IP地址
        String ip = IpUtil.getClientIp(request);

        // 解析IP归属地
        String region = ipUtil.getRegion(ip);
        String[] locationParts = ipUtil.parseIp(ip);

        // 获取UserAgent
        String userAgentString = IpUtil.getUserAgent(request);
        UserAgentParserUtil.UserAgentInfo uaInfo = UserAgentParserUtil.parse(userAgentString);

        // 获取请求URL信息
        String requestURI = request.getRequestURI();
        String queryString = request.getQueryString();
        String referer = IpUtil.getReferer(request);
        String refererDomain = IpUtil.extractDomain(referer);

        // 构建日志实体
        AccessLog logEntity = new AccessLog();
        logEntity.setOperation(accessLogAnnotation.value());
        logEntity.setIpAddress(ip);
        logEntity.setReferer(referer);
        logEntity.setRefererDomain(refererDomain);
        logEntity.setRelativeUrl(requestURI);
        logEntity.setQueryString(queryString != null ? queryString : "");
        logEntity.setCreateTime(LocalDateTime.now());

        // 状态和错误信息
        if (exception != null) {
            logEntity.setStatus(0);
            logEntity.setErrorMsg(exception.getMessage());
        } else {
            logEntity.setStatus(1);
        }

        // 浏览器和操作系统信息
        logEntity.setBrowser(uaInfo.getBrowser());
        logEntity.setBrowserVersion(uaInfo.getBrowserVersion());
        logEntity.setOs(simplifyOs(uaInfo.getOs()));
        logEntity.setOsVersion(uaInfo.getOsVersion());

        // 机器人信息
        logEntity.setIsRobot(uaInfo.getIsRobot());
        logEntity.setRobot(uaInfo.getRobot());
        logEntity.setRobotVersion(uaInfo.getRobotVersion());

        // 地理位置信息
        logEntity.setCountry(locationParts[0]);
        logEntity.setProvince(locationParts[1]);
        logEntity.setCity(locationParts[2]);
        logEntity.setIsp(locationParts[3]);
        logEntity.setLocation(region);

        // 提取文章ID（针对ARTICLE和PAGE类型）
        Long articleId = extractArticleId(joinPoint, result);
        if (articleId != null) {
            logEntity.setArticleId(articleId);
        }

        // 异步保存
        accessLogService.saveAccessLog(logEntity);

        log.debug("访问日志记录成功: {} - {} - {}", accessLogAnnotation.value(), ip, requestURI);
    }

    /**
     * 简化操作系统名称，去除Hutool解析出的服务器版本后缀
     */
    private String simplifyOs(String os) {
        if (os == null) {
            return null;
        }
        if (os.contains(" or ")) {
            // Windows 10 实际上可能是 Windows 11（相同内核版本）
            if ("Windows 10".equals(os.substring(0, os.indexOf(" or ")))) {
                return "Windows 11";
            }
            return os.substring(0, os.indexOf(" or "));
        }
        return os;
    }

    /**
     * 从方法参数或返回值中提取文章ID
     */
    private Long extractArticleId(ProceedingJoinPoint joinPoint, Object result) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        // 从路径参数中获取ID
        if (parameterNames != null) {
            for (int i = 0; i < parameterNames.length; i++) {
                if ("id".equals(parameterNames[i]) && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }
        }

        // 从参数中查找Long类型的ID
        for (Object arg : args) {
            if (arg instanceof Long) {
                return (Long) arg;
            }
        }

        return null;
    }
}