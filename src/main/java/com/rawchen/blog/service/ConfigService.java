package com.rawchen.blog.service;

import com.rawchen.blog.dto.ConfigDTO;
import com.rawchen.blog.entity.Config;
import com.rawchen.blog.vo.SiteConfigVO;

import java.util.List;
import java.util.Map;

/**
 * 配置服务接口
 *
 * @author RawChen
 */
public interface ConfigService {

    /**
     * 获取站点配置（公开）
     */
    SiteConfigVO getSiteConfig();

    /**
     * 获取所有配置（后台）
     */
    List<Config> getAllConfig();

    /**
     * 根据键获取配置
     */
    String getConfigByKey(String key);

    /**
     * 根据键获取配置，带默认值
     */
    String getConfigByKey(String key, String defaultValue);

    /**
     * 批量获取配置
     */
    Map<String, String> getConfigsByKeys(List<String> keys);

    /**
     * 更新配置
     */
    void updateConfig(ConfigDTO dto);

    /**
     * 批量更新配置
     */
    void updateConfigs(List<ConfigDTO> configs);

    /**
     * 根据键删除配置
     */
    void deleteConfig(String key);
}
