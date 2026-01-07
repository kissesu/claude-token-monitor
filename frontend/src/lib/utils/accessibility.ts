/**
 * @file 可访问性工具函数集合
 * @description 提供统一的可访问性增强功能，包括键盘导航、焦点管理、屏幕阅读器通知等
 * @author Atlas.oi
 * @date 2026-01-07
 */

/**
 * 宣布消息给屏幕阅读器
 *
 * 业务逻辑说明:
 * 1. 创建或获取 ARIA live region 元素
 * 2. 将消息设置到 live region
 * 3. 自动清除消息避免重复朗读
 *
 * @param message - 要宣布的消息
 * @param priority - 宣布优先级 ('polite' | 'assertive')
 * @param timeout - 清除消息的超时时间(毫秒)
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  timeout: number = 1000
): void {
  const liveRegionId = `aria-live-${priority}`;
  let liveRegion = document.getElementById(liveRegionId);

  // 如果 live region 不存在,创建它
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = liveRegionId;
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // 设置消息
  liveRegion.textContent = message;

  // 清除消息
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = '';
    }
  }, timeout);
}

/**
 * 键盘导航助手类
 * 提供统一的键盘事件处理
 */
export class KeyboardNavigationHelper {
  private handlers: Map<string, (event: KeyboardEvent) => void> = new Map();

  /**
   * 注册键盘事件处理器
   *
   * @param key - 键名 (例如: 'Escape', 'Enter', 'ArrowDown')
   * @param handler - 事件处理函数
   */
  on(key: string, handler: (event: KeyboardEvent) => void): void {
    this.handlers.set(key, handler);
  }

  /**
   * 处理键盘事件
   *
   * @param event - 键盘事件
   */
  handle(event: KeyboardEvent): void {
    const handler = this.handlers.get(event.key);
    if (handler) {
      handler(event);
    }
  }

  /**
   * 清除所有处理器
   */
  clear(): void {
    this.handlers.clear();
  }
}

/**
 * 焦点陷阱类
 * 将焦点限制在指定元素内(用于模态框等)
 */
export class FocusTrap {
  private element: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  /**
   * 可聚焦元素选择器
   */
  private static FOCUSABLE_SELECTORS = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  constructor(element: HTMLElement) {
    this.element = element;
  }

  /**
   * 激活焦点陷阱
   *
   * 业务逻辑说明:
   * 1. 保存当前焦点元素
   * 2. 获取容器内所有可聚焦元素
   * 3. 聚焦第一个可聚焦元素
   * 4. 监听键盘事件处理 Tab 导航
   */
  activate(): void {
    // 保存当前焦点
    this.previousFocus = document.activeElement as HTMLElement;

    // 获取可聚焦元素
    this.updateFocusableElements();

    // 聚焦第一个元素
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    // 监听 Tab 键
    document.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * 停用焦点陷阱
   *
   * 业务逻辑说明:
   * 1. 移除键盘事件监听
   * 2. 恢复之前的焦点
   */
  deactivate(): void {
    document.removeEventListener('keydown', this.handleKeydown);

    // 恢复焦点
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  /**
   * 更新可聚焦元素列表
   */
  private updateFocusableElements(): void {
    const elements = this.element.querySelectorAll(FocusTrap.FOCUSABLE_SELECTORS);
    this.focusableElements = Array.from(elements) as HTMLElement[];
  }

  /**
   * 处理键盘事件
   * 拦截 Tab 导航，确保焦点不会离开容器
   */
  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    const currentElement = document.activeElement as HTMLElement;

    // Shift + Tab
    if (event.shiftKey) {
      if (currentElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    }
    // Tab
    else {
      if (currentElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };
}

/**
 * 获取图表数据的可访问性描述
 *
 * @param data - 图表数据数组
 * @param type - 图表类型
 * @returns 可访问性描述文本
 */
export function getChartAccessibilityDescription(
  data: Array<{ label?: string; value: number; [key: string]: any }>,
  type: 'line' | 'pie' | 'bar' | 'heatmap'
): string {
  if (data.length === 0) return '图表暂无数据';

  const typeLabels = {
    line: '折线图',
    pie: '饼图',
    bar: '柱状图',
    heatmap: '热力图'
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...data.map(item => item.value));
  const min = Math.min(...data.map(item => item.value));
  const avg = total / data.length;

  let description = `${typeLabels[type]}, 包含 ${data.length} 个数据点。`;
  description += ` 总计: ${total.toLocaleString()},`;
  description += ` 最大值: ${max.toLocaleString()},`;
  description += ` 最小值: ${min.toLocaleString()},`;
  description += ` 平均值: ${Math.round(avg).toLocaleString()}。`;

  // 添加数据点详情(最多5个)
  if (data.length <= 5) {
    description += ' 数据详情: ';
    data.forEach((item, index) => {
      const label = item.label || `项目 ${index + 1}`;
      description += `${label}: ${item.value.toLocaleString()}`;
      if (index < data.length - 1) description += ', ';
    });
  }

  return description;
}

/**
 * 检查元素是否在视口内
 *
 * @param element - 要检查的元素
 * @returns 是否在视口内
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 滚动元素进入视口
 *
 * @param element - 要滚动的元素
 * @param options - 滚动选项
 */
export function scrollIntoViewIfNeeded(
  element: HTMLElement,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
): void {
  if (!isElementInViewport(element)) {
    element.scrollIntoView(options);
  }
}

/**
 * 颜色对比度计算
 * 用于验证 WCAG 颜色对比度标准
 *
 * @param color1 - 第一个颜色 (十六进制格式: #RRGGBB)
 * @param color2 - 第二个颜色 (十六进制格式: #RRGGBB)
 * @returns 对比度比率
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    // 移除 # 前缀
    hex = hex.replace('#', '');

    // 转换为 RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // 应用 sRGB 校正
    const sRGB = (channel: number) => {
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    // 计算相对亮度
    return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b);
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查颜色对比度是否符合 WCAG 标准
 *
 * @param foreground - 前景色 (十六进制格式)
 * @param background - 背景色 (十六进制格式)
 * @param level - WCAG 级别 ('AA' | 'AAA')
 * @param size - 文本大小 ('normal' | 'large')
 * @returns 是否符合标准
 */
export function meetsWCAGContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);

  // WCAG 标准要求
  const requirements = {
    AA: {
      normal: 4.5,
      large: 3.0
    },
    AAA: {
      normal: 7.0,
      large: 4.5
    }
  };

  return ratio >= requirements[level][size];
}

/**
 * 减少动画偏好检测
 *
 * @returns 用户是否偏好减少动画
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 高对比度模式检测
 *
 * @returns 用户是否启用高对比度模式
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * 色盲友好的颜色方案
 * 使用 ColorBrewer 推荐的色盲安全颜色
 */
export const COLOR_BLIND_FRIENDLY_PALETTE = {
  // 适用于所有类型色盲的颜色
  safe: [
    '#0173B2', // 蓝色
    '#DE8F05', // 橙色
    '#029E73', // 绿松石色
    '#CC78BC', // 紫色
    '#CA9161', // 棕色
    '#FBAFE4', // 粉色
    '#949494', // 灰色
    '#ECE133', // 黄色
  ],

  // 单色方案(适用于完全色盲)
  monochrome: [
    '#000000',
    '#404040',
    '#737373',
    '#A6A6A6',
    '#D9D9D9',
    '#FFFFFF',
  ]
};
