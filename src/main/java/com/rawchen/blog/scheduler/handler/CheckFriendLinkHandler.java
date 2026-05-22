package com.rawchen.blog.scheduler.handler;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.entity.FriendLink;
import com.rawchen.blog.mapper.FriendLinkMapper;
import com.rawchen.blog.scheduler.JobHandler;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobDataMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

/**
 * 检测友链处理器
 * 每天凌晨检测友链是否能访问
 * 无法访问：status=2，sortOrder设为最大值
 * 可访问：status=1，sortOrder设为正常最后一个的order
 *
 * @author RawChen
 */
@Slf4j
@Component
public class CheckFriendLinkHandler implements JobHandler {

    @Autowired
    private FriendLinkMapper friendLinkMapper;

    private static final int CONNECT_TIMEOUT = 10000; // 10秒超时
    private static final int READ_TIMEOUT = 10000;

    @Override
    public String execute(JobDataMap context) {
        log.info("开始检测友链状态...");

        List<FriendLink> allLinks = friendLinkMapper.selectList(
                new LambdaQueryWrapper<FriendLink>()
                        .in(FriendLink::getStatus, 1, 2)
                        .orderByAsc(FriendLink::getSortOrder)
        );

        if (allLinks.isEmpty()) {
            return "没有需要检测的友链";
        }

        // 获取正常友链中最大的sortOrder
        Integer maxSortOrder = friendLinkMapper.selectMaxSortOrder();

        int successCount = 0;
        int failCount = 0;

        for (FriendLink link : allLinks) {
            boolean accessible = checkUrlAccessible(link.getSiteUrl());

            if (!accessible) {
                // 无法访问：设置为失效，sortOrder设为最大值+1
                link.setStatus(2);
                if (maxSortOrder != null) {
                    link.setSortOrder(maxSortOrder + 1);
                    maxSortOrder++;
                } else {
                    link.setSortOrder(999);
                }
                friendLinkMapper.updateById(link);
                log.warn("友链无法访问: {} - {}", link.getSiteName(), link.getSiteUrl());
                failCount++;
            } else {
                // 可以访问：设置为正常
                if (link.getStatus() == 2) {
                    // 之前是失效状态，现在恢复了
                    link.setStatus(1);
                    // 获取正常状态友链的数量，设置到末尾
                    Integer lastNormalOrder = getLastNormalSortOrder();
                    link.setSortOrder(lastNormalOrder != null ? lastNormalOrder + 1 : 1);
                    friendLinkMapper.updateById(link);
                    log.info("友链已恢复: {} - {}", link.getSiteName(), link.getSiteUrl());
                }
                successCount++;
            }
        }

        String result = String.format("检测完成: 成功%d个, 失败%d个", successCount, failCount);
        log.info(result);
        return result;
    }

    @Override
    public String getName() {
        return "checkFriendLink";
    }

    @Override
    public String getDescription() {
        return "检测友链状态";
    }

    /**
     * 检测URL是否可访问
     */
    private boolean checkUrlAccessible(String urlStr) {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(urlStr);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(CONNECT_TIMEOUT);
            connection.setReadTimeout(READ_TIMEOUT);
            connection.setInstanceFollowRedirects(true);
            // 设置User-Agent，避免被拦截
            connection.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            int responseCode = connection.getResponseCode();
            return responseCode >= 200 && responseCode < 400;
        } catch (Exception e) {
            log.debug("检测友链失败: {} - {}", urlStr, e.getMessage());
            return false;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    /**
     * 获取正常状态友链中最后一个的sortOrder
     */
    private Integer getLastNormalSortOrder() {
        FriendLink lastNormal = friendLinkMapper.selectOne(
                new LambdaQueryWrapper<FriendLink>()
                        .eq(FriendLink::getStatus, 1)
                        .orderByDesc(FriendLink::getSortOrder)
                        .last("LIMIT 1")
        );
        return lastNormal != null ? lastNormal.getSortOrder() : null;
    }
}
