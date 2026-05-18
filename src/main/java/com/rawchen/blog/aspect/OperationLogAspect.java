package com.rawchen.blog.aspect;

import cn.hutool.json.JSONUtil;
import com.rawchen.blog.annotation.OperationLogAnnotation;
import com.rawchen.blog.entity.User;
import com.rawchen.blog.mapper.OperationLogMapper;
import com.rawchen.blog.util.IpUtil;
import com.rawchen.blog.util.UserAgentParserUtil;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 操作日志切面
 *
 * @author RawChen
 */
@Slf4j
@Aspect
@Component
public class OperationLogAspect {

    @Autowired
    private OperationLogMapper operationLogMapper;

    @Autowired
    private IpUtil ipUtil;

    @Around("@annotation(operationLogAnnotation)")
    public Object around(ProceedingJoinPoint joinPoint, OperationLogAnnotation operationLogAnnotation) throws Throwable {
        // 执行方法
        Object result = joinPoint.proceed();

        try {
            // 保存操作日志
            saveOperationLog(joinPoint, operationLogAnnotation, result);
        } catch (Exception e) {
            log.error("保存操作日志失败", e);
        }

        return result;
    }

    private void saveOperationLog(ProceedingJoinPoint joinPoint, OperationLogAnnotation operationLogAnnotation, Object result) {
        // 获取当前请求
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return;
        }

        HttpServletRequest request = attributes.getRequest();

        // 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = null;
        String username = "anonymous";
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            userId = user.getId();
            username = user.getUsername();
        }

        // 获取IP地址
        String ip = IpUtil.getClientIp(request);

        // 解析IP归属地
        String region = ipUtil.getRegion(ip);
        String[] locationParts = ipUtil.parseIp(ip);

        // 获取UserAgent
        String userAgentString = IpUtil.getUserAgent(request);
        UserAgentParserUtil.UserAgentInfo uaInfo = UserAgentParserUtil.parse(userAgentString);

        // 构建日志实体
        com.rawchen.blog.entity.OperationLog logEntity = new com.rawchen.blog.entity.OperationLog();
        logEntity.setUserId(userId);
        logEntity.setUsername(username);
        logEntity.setOperationType(operationLogAnnotation.type().name());
        logEntity.setTargetType(operationLogAnnotation.target().name());
        logEntity.setIpAddress(ip);
        logEntity.setUserAgent(userAgentString);
        logEntity.setCreateTime(LocalDateTime.now());

        // 设置地理位置信息
        logEntity.setCountry(locationParts[0]);
        logEntity.setProvince(locationParts[1]);
        logEntity.setCity(locationParts[2]);
        logEntity.setIsp(locationParts[3]);
        logEntity.setLocation(region);

        // 记录操作详情
        if (operationLogAnnotation.recordDetail()) {
            Map<String, Object> detail = new HashMap<>();
            detail.put("targetId", extractTargetId(joinPoint, result));
            detail.put("description", operationLogAnnotation.description());
            detail.put("method", joinPoint.getSignature().getName());
            logEntity.setDetail(JSONUtil.toJsonStr(detail));
            logEntity.setTargetId(extractTargetId(joinPoint, result));
        }

        // 保存日志
        operationLogMapper.insert(logEntity);

        log.debug("操作日志记录成功: {} - {} - {}", username, operationLogAnnotation.type(), operationLogAnnotation.target());
    }

    /**
     * 从方法参数或返回值中提取目标ID
     */
    private Long extractTargetId(ProceedingJoinPoint joinPoint, Object result) {
        // 尝试从返回值获取ID
        if (result instanceof Long) {
            return (Long) result;
        }

        // 尝试从方法参数获取ID
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        if (parameterNames != null) {
            for (int i = 0; i < parameterNames.length; i++) {
                if ("id".equals(parameterNames[i]) && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }
        }

        // 从路径变量中获取
        for (Object arg : args) {
            if (arg instanceof Long) {
                return (Long) arg;
            }
        }

        return null;
    }
}