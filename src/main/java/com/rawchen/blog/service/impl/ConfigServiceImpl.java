package com.rawchen.blog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rawchen.blog.dto.ConfigDTO;
import com.rawchen.blog.entity.Config;
import com.rawchen.blog.mapper.ConfigMapper;
import com.rawchen.blog.service.ConfigService;
import com.rawchen.blog.vo.SiteConfigVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 配置服务实现
 *
 * @author RawChen
 */
@Slf4j
@Service
public class ConfigServiceImpl implements ConfigService {

    @Autowired
    private ConfigMapper configMapper;

    // 配置键常量（数据库存储用下划线格式）
    private static final String KEY_SITE_NAME = "site_name";
    private static final String KEY_SITE_DESCRIPTION = "site_description";
    private static final String KEY_SITE_KEYWORDS = "site_keywords";
    private static final String KEY_SITE_LOGO = "site_logo";
    private static final String KEY_SITE_FOOTER_LOGO = "site_footer_logo";
    private static final String KEY_SITE_FAVICON = "site_favicon";
    private static final String KEY_FOOTER_INFO = "footer_info";
    private static final String KEY_SITE_ICP = "site_icp";
    private static final String KEY_GITHUB_URL = "github_url";
    private static final String KEY_TELEGRAM_URL = "telegram_url";
    private static final String KEY_WEIBO_URL = "weibo_url";
    private static final String KEY_ZHIHU_URL = "zhihu_url";
    private static final String KEY_TWITTER_URL = "twitter_url";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_WECHAT_QRCODE = "wechat_qrcode";
    private static final String KEY_QQ_NUMBER = "qq_number";
    private static final String KEY_STATS_URL = "stats_url";
    private static final String KEY_TRACKING_CODE = "tracking_code";

    @Override
    public SiteConfigVO getSiteConfig() {
        SiteConfigVO vo = new SiteConfigVO();

        vo.setSiteName(getConfigByKey(KEY_SITE_NAME, "我的博客"));
        vo.setSiteDescription(getConfigByKey(KEY_SITE_DESCRIPTION, "一个简单的博客系统"));
        vo.setSiteKeywords(getConfigByKey(KEY_SITE_KEYWORDS, "博客,技术"));
        vo.setSiteLogo(getConfigByKey(KEY_SITE_LOGO));
        vo.setSiteFooterLogo(getConfigByKey(KEY_SITE_FOOTER_LOGO));
        vo.setSiteFavicon(getConfigByKey(KEY_SITE_FAVICON));
        vo.setFooterInfo(getConfigByKey(KEY_FOOTER_INFO));
        vo.setSiteIcp(getConfigByKey(KEY_SITE_ICP));
        vo.setGithubUrl(getConfigByKey(KEY_GITHUB_URL));
        vo.setTelegramUrl(getConfigByKey(KEY_TELEGRAM_URL));
        vo.setWeiboUrl(getConfigByKey(KEY_WEIBO_URL));
        vo.setZhihuUrl(getConfigByKey(KEY_ZHIHU_URL));
        vo.setTwitterUrl(getConfigByKey(KEY_TWITTER_URL));
        vo.setEmail(getConfigByKey(KEY_EMAIL));
        vo.setWechatQrcode(getConfigByKey(KEY_WECHAT_QRCODE));
        vo.setQqNumber(getConfigByKey(KEY_QQ_NUMBER));
        vo.setStatsUrl(getConfigByKey(KEY_STATS_URL));
        vo.setTrackingCode(getConfigByKey(KEY_TRACKING_CODE));

        return vo;
    }

    @Override
    public List<Config> getAllConfig() {
        return configMapper.selectList(new LambdaQueryWrapper<Config>()
                .orderByAsc(Config::getConfigKey));
    }

    @Override
    public String getConfigByKey(String key) {
        return getConfigByKey(key, null);
    }

    @Override
    public String getConfigByKey(String key, String defaultValue) {
        Config config = configMapper.selectOne(new LambdaQueryWrapper<Config>()
                .eq(Config::getConfigKey, key));

        if (config != null && StringUtils.hasText(config.getConfigValue())) {
            return config.getConfigValue();
        }
        return defaultValue;
    }

    @Override
    public Map<String, String> getConfigsByKeys(List<String> keys) {
        List<Config> configs = configMapper.selectList(new LambdaQueryWrapper<Config>()
                .in(Config::getConfigKey, keys));

        Map<String, String> result = new HashMap<>();
        for (Config config : configs) {
            result.put(config.getConfigKey(), config.getConfigValue());
        }
        return result;
    }

    @Override
    public void updateConfig(ConfigDTO dto) {
        Config config = configMapper.selectOne(new LambdaQueryWrapper<Config>()
                .eq(Config::getConfigKey, dto.getConfigKey()));

        if (config == null) {
            // 新增
            config = new Config();
            config.setConfigKey(dto.getConfigKey());
            config.setConfigValue(dto.getConfigValue());
            config.setConfigType(dto.getConfigType());
            config.setDescription(dto.getDescription());
            configMapper.insert(config);
        } else {
            // 更新
            config.setConfigValue(dto.getConfigValue());
            if (StringUtils.hasText(dto.getConfigType())) {
                config.setConfigType(dto.getConfigType());
            }
            if (StringUtils.hasText(dto.getDescription())) {
                config.setDescription(dto.getDescription());
            }
            configMapper.updateById(config);
        }
        log.info("更新配置: {} = {}", dto.getConfigKey(), dto.getConfigValue());
    }

    @Override
    public void updateConfigs(List<ConfigDTO> configs) {
        for (ConfigDTO config : configs) {
            updateConfig(config);
        }
    }

    @Override
    public void deleteConfig(String key) {
        configMapper.delete(new LambdaQueryWrapper<Config>()
                .eq(Config::getConfigKey, key));
        log.info("删除配置: {}", key);
    }
}
