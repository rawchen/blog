package com.rawchen.blog.controller;

import com.rawchen.blog.common.R;
import com.rawchen.blog.dto.ConfigDTO;
import com.rawchen.blog.entity.Config;
import com.rawchen.blog.service.ConfigService;
import com.rawchen.blog.vo.SiteConfigVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

/**
 * 配置控制器
 *
 * @author RawChen
 */
@Api(tags = "配置管理")
@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Autowired
    private ConfigService configService;

    @ApiOperation("获取站点配置（公开）")
    @GetMapping("/site")
    public R<SiteConfigVO> getSiteConfig() {
        return R.ok(configService.getSiteConfig());
    }

    // ========== 后台管理接口 ==========

    @ApiOperation("获取所有配置（后台）")
    @GetMapping("/all")
    public R<List<Config>> getAllConfig() {
        return R.ok(configService.getAllConfig());
    }

    @ApiOperation("根据键获取配置")
    @GetMapping("/{key}")
    public R<String> getConfigByKey(@PathVariable String key) {
        return R.ok(configService.getConfigByKey(key));
    }

    @ApiOperation("更新配置")
    @PutMapping
    public R<Void> updateConfig(@Valid @RequestBody ConfigDTO dto) {
        configService.updateConfig(dto);
        return R.ok();
    }

    @ApiOperation("批量更新配置")
    @PutMapping("/batch")
    public R<Void> updateConfigs(@Valid @RequestBody List<ConfigDTO> configs) {
        configService.updateConfigs(configs);
        return R.ok();
    }

    @ApiOperation("删除配置")
    @DeleteMapping("/{key}")
    @PreAuthorize("hasAuthority('system:config:delete')")
    public R<Void> deleteConfig(@PathVariable String key) {
        configService.deleteConfig(key);
        return R.ok();
    }
}
