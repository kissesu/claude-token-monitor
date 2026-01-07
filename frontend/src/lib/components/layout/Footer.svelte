<!--
  @file Footer 页面底部组件
  @description 应用底部信息栏，显示版本、作者和数据来源信息
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  /**
   * 应用版本信息
   * 从 package.json 读取
   */
  const appVersion = '1.0.0';

  /**
   * 当前年份
   * 用于版权声明
   */
  const currentYear = new Date().getFullYear();

  /**
   * 数据来源说明
   */
  const dataSource = 'Claude API';

  /**
   * 作者信息
   */
  const author = 'Atlas.oi';

  /**
   * 项目链接（可选）
   */
  const projectLinks: Array<{ label: string; url: string }> = [
    // { label: 'GitHub', url: 'https://github.com/your-repo' },
    // { label: '文档', url: 'https://docs.example.com' }
  ];
</script>

<!-- 页面底部容器 -->
<footer
  class="footer bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 mt-auto"
  role="contentinfo"
>
  <div class="container mx-auto px-4 py-6">
    <!-- 底部内容网格布局 -->
    <div class="footer-content grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
      <!-- 版本信息 -->
      <div class="version-info text-center md:text-left">
        <div class="flex items-center justify-center md:justify-start gap-2">
          <svg
            class="w-4 h-4 text-primary-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm text-surface-600 dark:text-surface-400">
            版本 {appVersion}
          </span>
        </div>
      </div>

      <!-- 作者和版权信息 -->
      <div class="author-info text-center">
        <p class="text-sm text-surface-600 dark:text-surface-400">
          Made by
          <span class="font-semibold text-primary-500 dark:text-primary-400">
            {author}
          </span>
        </p>
        <p class="text-xs text-surface-500 dark:text-surface-500 mt-1">
          © {currentYear} All rights reserved
        </p>
      </div>

      <!-- 数据来源说明 -->
      <div class="data-source-info text-center md:text-right">
        <div class="flex items-center justify-center md:justify-end gap-2">
          <svg
            class="w-4 h-4 text-surface-500 dark:text-surface-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          <span class="text-sm text-surface-600 dark:text-surface-400">
            数据来源：{dataSource}
          </span>
        </div>
      </div>
    </div>

    <!-- 项目链接（可选） -->
    {#if projectLinks.length > 0}
      <div class="project-links mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <div class="flex justify-center gap-4">
          {#each projectLinks as link}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline
                     transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500
                     focus:ring-offset-2 dark:focus:ring-offset-surface-800 rounded px-2 py-1"
            >
              {link.label}
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 技术栈说明（可选显示） -->
    <div class="tech-stack mt-4 text-center">
      <p class="text-xs text-surface-500 dark:text-surface-500">
        Built with
        <span class="font-medium">Svelte</span>
        +
        <span class="font-medium">TypeScript</span>
        +
        <span class="font-medium">Skeleton UI</span>
        +
        <span class="font-medium">Tailwind CSS</span>
      </p>
    </div>
  </div>
</footer>

<style>
  /**
   * 底部容器样式
   */
  .footer {
    position: relative;
  }

  /**
   * 底部内容样式
   */
  .footer-content {
    max-width: 100%;
  }

  /**
   * 链接悬停效果
   */
  .project-links a {
    position: relative;
  }

  .project-links a::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background-color: currentColor;
    transition: width 0.3s ease;
  }

  .project-links a:hover::after {
    width: 100%;
  }

  /**
   * SVG 图标动画
   */
  svg {
    transition: transform 0.2s ease;
  }

  .version-info:hover svg,
  .data-source-info:hover svg {
    transform: scale(1.1);
  }

  /**
   * 技术栈文字样式
   */
  .tech-stack span {
    color: var(--color-primary-500);
  }

  .dark .tech-stack span {
    color: var(--color-primary-400);
  }

  /**
   * 响应式设计
   * 在小屏幕上调整布局和间距
   */
  @media (max-width: 768px) {
    .footer-content {
      gap: 1rem;
    }

    .footer {
      padding-top: 1rem;
      padding-bottom: 1rem;
    }

    .tech-stack {
      margin-top: 0.75rem;
    }
  }

  /**
   * 淡入动画
   */
  .footer {
    animation: fadeIn 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
