package com.rawchen.blog.service;

import com.rawchen.blog.dto.MigrationConnectDTO;
import com.rawchen.blog.dto.MigrationConnectResponseDTO;
import com.rawchen.blog.dto.MigrationProgressDTO;
import com.rawchen.blog.dto.MigrationStatsDTO;

import java.util.List;

/**
 * 数据迁移服务接口
 *
 * @author RawChen
 */
public interface MigrationService {

    /**
     * 测试数据库连接并获取数据库列表
     *
     * @param dto 连接参数
     * @return 数据库列表
     */
    List<String> getDatabases(MigrationConnectDTO dto);

    /**
     * 测试数据库连接并获取待迁移数据统计
     *
     * @param dto 连接参数
     * @return 连接响应
     */
    MigrationConnectResponseDTO testConnection(MigrationConnectDTO dto);

    /**
     * 获取已迁移数据统计
     *
     * @return 统计数据
     */
    MigrationStatsDTO getMigrationStats();

    /**
     * 开始迁移
     *
     * @param dto 连接参数
     * @param currentUserId 当前用户ID
     */
    void startMigration(MigrationConnectDTO dto, Long currentUserId);

    /**
     * 获取迁移进度
     *
     * @return 进度信息
     */
    MigrationProgressDTO getProgress();
}
