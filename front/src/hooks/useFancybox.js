import { useState, useEffect } from "react";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

// 判断是否为竖屏移动设备
function getPortraitMobile() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(max-width: 768px) and (orientation: portrait)').matches;
}

// 从 localStorage 获取 ossStyle 配置
function getOssStyle() {
  try {
    const cached = localStorage.getItem('site_config');
    if (cached) {
      const config = JSON.parse(cached);
      return config?.ossStyle || '';
    }
  } catch {
    // ignore
  }
  return '';
}

// 检查 URL 是否包含 OSS 处理参数
function hasOssStyle(url, ossStyle) {
  if (!url) return false;
  if (url.includes('x-oss-process')) return true;
  if (ossStyle && url.includes(ossStyle)) return true;
  return false;
}

// 获取原图 URL（移除 OSS 处理参数）
function getOriginalUrl(url, ossStyle) {
  if (!url) return url;
  let originalUrl = url;

  if (ossStyle && originalUrl.includes(ossStyle)) {
    originalUrl = originalUrl.replace(ossStyle, '');
  }

  try {
    const urlObj = new URL(originalUrl);
    if (urlObj.searchParams.has('x-oss-process')) {
      urlObj.searchParams.delete('x-oss-process');
      originalUrl = urlObj.toString();
    }
  } catch {
    originalUrl = originalUrl.replace(/[?&]x-oss-process=[^&]*/g, '');
    originalUrl = originalUrl.replace(/[?&]$/, '');
  }

  return originalUrl;
}

// 存储当前 ossStyle 用于事件处理
let currentOssStyle = '';

export default function useFancybox(options = {}) {
  const [root, setRoot] = useState(null);
  const [portraitMobile, setPortraitMobile] = useState(getPortraitMobile);

  // 监听竖屏移动设备状态变化（窗口尺寸/方向变化）
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 768px) and (orientation: portrait)');
    const handler = (e) => setPortraitMobile(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  useEffect(() => {
    if (root) {
      currentOssStyle = getOssStyle();

      const fancyboxOptions = {
        hideScrollbar: false,
        placeFocusBack: false,
        Hash: false,
        Carousel: {
          Thumbs: {
            type: 'classic',
            Carousel: {
              // 竖屏移动设备：缩略图水平显示在底部；其它：垂直显示在左侧
              vertical: !portraitMobile,

              center: (ref) => {
                return ref.getTotalSlideDim() > ref.getViewportDim();
              },
            },
          },
          Toolbar: {
            items: {
              viewOriginal: {
                tpl: `<button class="f-button" title="查看原图" data-fancybox-view-original style="display:none">原图</button>`,
                click: (carousel, event) => {
                  const page = carousel.getPage();
                  const slide = page?.slides?.[0];

                  if (slide && slide.src) {
                    const originalUrl = getOriginalUrl(slide.src, currentOssStyle);
                    slide.src = originalUrl;

                    // 更新所有相关图片元素
                    const activeSlide = document.querySelector('.fancybox__slide.is-selected');
                    if (activeSlide) {
                      const imgs = activeSlide.querySelectorAll('img');
                      imgs.forEach(img => {
                        img.onload = () => {
                          // 在 fancybox 容器内显示 toast
                          const container = document.querySelector('.fancybox__container');
                          if (container) {
                            const toast = document.createElement('div');
                            toast.className = 'global-toast';
                            toast.textContent = '已加载原图';
                            toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(1);padding:10px 20px;background:rgba(0,0,0,0.6);color:#fff;border-radius:2px;font-size:14px;z-index:99999;opacity:1;';
                            container.appendChild(toast);
                            setTimeout(() => {
                              toast.style.opacity = '0';
                              setTimeout(() => toast.remove(), 300);
                            }, 2000);
                          }
                        };
                        if (img.complete) {
                          img.onload = null;
                          // 在 fancybox 容器内显示 toast
                          const container = document.querySelector('.fancybox__container');
                          if (container) {
                            const toast = document.createElement('div');
                            toast.className = 'global-toast';
                            toast.textContent = '已加载原图';
                            toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(1);padding:10px 20px;background:rgba(0,0,0,0.6);color:#fff;border-radius:2px;font-size:14px;z-index:99999;opacity:1;';
                            container.appendChild(toast);
                            setTimeout(() => {
                              toast.style.opacity = '0';
                              setTimeout(() => toast.remove(), 300);
                            }, 2000);
                          }
                        }
                        img.src = originalUrl;
                      });
                    }

                    const btn = event.currentTarget;
                    if (btn) {
                      btn.style.display = 'none';
                    }
                  }
                },
              },
            },
            display: {
              left: ['infobar'],
              middle: [],
              right: ['viewOriginal', 'toggleFull', 'fullscreen', 'thumbs', 'close'],
            },
          },
        },
        on: {
          'Carousel.ready Carousel.change': (fancybox) => {
            const slide = fancybox.getSlide();
            const btn = document.querySelector('[data-fancybox-view-original]');
            if (btn) {
              if (slide?.src && hasOssStyle(slide.src, currentOssStyle)) {
                btn.style.display = 'inline-flex';
              } else {
                btn.style.display = 'none';
              }
            }
          },
        },
        ...options,
      };

      Fancybox.bind(root, "[data-fancybox]", fancyboxOptions);
      return () => Fancybox.unbind(root, "[data-fancybox]");
    }
  }, [root, options, portraitMobile]);

  return [setRoot];
}
