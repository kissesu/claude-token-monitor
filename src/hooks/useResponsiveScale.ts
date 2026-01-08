import { useEffect } from 'react';

/**
 * 响应式缩放 Hook
 * 根据窗口宽度动态调整根元素 font-size，实现全局等比缩放
 * @param designWidth 设计稿基准宽度，默认 1280
 * @param baseFontSize 基准字体大小，默认 16px
 */
export function useResponsiveScale(designWidth = 1280, baseFontSize = 16) {
  useEffect(() => {
    const handleResize = () => {
      // 计算当前缩放比例
      const scale = window.innerWidth / designWidth;
      // 计算新的根字体大小
      // 限制最小缩放为 0.8 (防止文字过小看不清)，最大无限制或按需限制
      const newFontSize = Math.max(scale * baseFontSize, 12); 
      
      document.documentElement.style.fontSize = `${newFontSize}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // 清理时恢复默认
      document.documentElement.style.fontSize = '';
    };
  }, [designWidth, baseFontSize]);
}
