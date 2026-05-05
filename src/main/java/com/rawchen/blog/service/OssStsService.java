package com.rawchen.blog.service;

import com.rawchen.blog.vo.StsTokenVO;

/**
 * OSS STS服务接口
 *
 * @author RawChen
 * @date 2025-03-17
 */
public interface OssStsService {

    /**
     * 获取STS临时凭证
     *
     * @return STS临时凭证信息
     */
    StsTokenVO getStsToken();
}
