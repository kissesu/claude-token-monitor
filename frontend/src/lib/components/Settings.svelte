<!--
  @file 设置面板组件
  @description 用户设置界面，包含主题、刷新频率、通知和关于信息
  @author Atlas.oi
  @date 2026-01-07
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { themeStore, currentMode, appliedTheme, ThemeMode } from '$lib/stores/themeStore';
  import { exportService, exportState } from '$lib/services/export';
  import { ExportFormat } from '$lib/services/api';
  import { FocusTrap, announce } from '$lib/utils/accessibility';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  // ============================================
  // 设置状态
  // ============================================

  /**
   * 当前活动的设置标签页
   */
  let activeTab: 'appearance' | 'data' | 'notifications' | 'about' = 'appearance';

  /**
   * 焦点陷阱实例
   */
  let focusTrap: FocusTrap | null = null;

  /**
   * 设置面板元素引用
   */
  let settingsPanelRef: HTMLDivElement;

  /**
   * 自动刷新间隔（秒）
   * 0 表示禁用自动刷新
   */
  let refreshInterval = 30;

  /**
   * 是否启用通知
   */
  let notificationsEnabled = false;

  /**
   * 高消耗警告阈值（Token 数）
   */
  let highUsageThreshold = 100000;

  /**
   * 导出日期范围
   */
  let exportStartDate = '';
  let exportEndDate = '';

  /**
   * 选择的导出格式
   */
  let selectedExportFormat: ExportFormat = ExportFormat.JSON;

  // ============================================
  // 方法
  // ============================================

  /**
   * 切换主题模式
   *
   * @param mode - 主题模式
   */
  function setThemeMode(mode: ThemeMode): void {
    themeStore.setMode(mode);
    // 宣布主题变更
    const modeNames = {
      [ThemeMode.LIGHT]: '浅色模式',
      [ThemeMode.DARK]: '深色模式',
      [ThemeMode.SYSTEM]: '跟随系统模式'
    };
    announce(`已切换到${modeNames[mode]}`);
  }

  /**
   * 关闭设置面板
   */
  function handleClose(): void {
    dispatch('close');
  }

  /**
   * 处理键盘事件
   * 支持 Escape 键关闭面板
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  /**
   * 切换标签页
   */
  function switchTab(tab: typeof activeTab): void {
    activeTab = tab;
    announce(`已切换到${getTabLabel(tab)}标签页`, 'polite');
  }

  /**
   * 获取标签页标签
   */
  function getTabLabel(tab: typeof activeTab): string {
    const labels = {
      appearance: '外观',
      data: '数据',
      notifications: '通知',
      about: '关于'
    };
    return labels[tab];
  }

  /**
   * 执行数据导出
   */
  async function handleExport(): Promise<void> {
    await exportService.export({
      format: selectedExportFormat,
      startDate: exportStartDate || undefined,
      endDate: exportEndDate || undefined,
      includeDetails: true,
    });

    // 宣布导出结果
    if ($exportState.status === 'completed') {
      announce('数据导出成功');
    } else if ($exportState.status === 'error') {
      announce(`数据导出失败: ${$exportState.errorMessage}`, 'assertive');
    }
  }

  /**
   * 保存刷新设置
   */
  function saveRefreshSettings(): void {
    localStorage.setItem('claude-monitor-refresh-interval', String(refreshInterval));
  }

  /**
   * 保存通知设置
   */
  function saveNotificationSettings(): void {
    localStorage.setItem('claude-monitor-notifications', JSON.stringify({
      enabled: notificationsEnabled,
      highUsageThreshold,
    }));
  }

  /**
   * 请求通知权限
   */
  async function requestNotificationPermission(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      notificationsEnabled = permission === 'granted';
      saveNotificationSettings();
    }
  }

  // ============================================
  // 生命周期
  // ============================================

  // 加载保存的设置
  if (typeof window !== 'undefined') {
    const savedInterval = localStorage.getItem('claude-monitor-refresh-interval');
    if (savedInterval) {
      refreshInterval = parseInt(savedInterval, 10);
    }

    const savedNotifications = localStorage.getItem('claude-monitor-notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        notificationsEnabled = parsed.enabled || false;
        highUsageThreshold = parsed.highUsageThreshold || 100000;
      } catch (e) {
        // 忽略解析错误
      }
    }
  }

  /**
   * 组件挂载时初始化
   */
  onMount(() => {
    // 初始化焦点陷阱
    if (settingsPanelRef) {
      focusTrap = new FocusTrap(settingsPanelRef);
      focusTrap.activate();
    }

    // 添加键盘监听
    document.addEventListener('keydown', handleKeydown);

    return () => {
      // 清理焦点陷阱
      if (focusTrap) {
        focusTrap.deactivate();
      }
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<!-- 设置面板容器 -->
<div
  bind:this={settingsPanelRef}
  class="settings-panel"
  role="dialog"
  aria-modal="true"
  aria-labelledby="settings-title"
  aria-describedby="settings-description"
>
  <!-- 屏幕阅读器专用描述 -->
  <div id="settings-description" class="sr-only">
    应用设置对话框，包含外观、数据、通知和关于四个标签页
  </div>

  <!-- 头部 -->
  <div class="settings-header">
    <h2 id="settings-title" class="settings-title">设置</h2>
    <button
      class="close-button"
      on:click={handleClose}
      aria-label="关闭设置"
      type="button"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>

  <!-- 标签页导航 -->
  <div class="tabs-nav" role="tablist" aria-label="设置分类">
    <button
      role="tab"
      class="tab-button"
      class:active={activeTab === 'appearance'}
      on:click={() => switchTab('appearance')}
      aria-selected={activeTab === 'appearance'}
      aria-controls="tab-panel-appearance"
      id="tab-appearance"
      tabindex={activeTab === 'appearance' ? 0 : -1}
    >
      外观
    </button>
    <button
      role="tab"
      class="tab-button"
      class:active={activeTab === 'data'}
      on:click={() => switchTab('data')}
      aria-selected={activeTab === 'data'}
      aria-controls="tab-panel-data"
      id="tab-data"
      tabindex={activeTab === 'data' ? 0 : -1}
    >
      数据
    </button>
    <button
      role="tab"
      class="tab-button"
      class:active={activeTab === 'notifications'}
      on:click={() => switchTab('notifications')}
      aria-selected={activeTab === 'notifications'}
      aria-controls="tab-panel-notifications"
      id="tab-notifications"
      tabindex={activeTab === 'notifications' ? 0 : -1}
    >
      通知
    </button>
    <button
      role="tab"
      class="tab-button"
      class:active={activeTab === 'about'}
      on:click={() => switchTab('about')}
      aria-selected={activeTab === 'about'}
      aria-controls="tab-panel-about"
      id="tab-about"
      tabindex={activeTab === 'about' ? 0 : -1}
    >
      关于
    </button>
  </div>

  <!-- 标签页内容 -->
  <div class="tabs-content">
    <!-- 外观设置 -->
    {#if activeTab === 'appearance'}
      <div
        role="tabpanel"
        id="tab-panel-appearance"
        aria-labelledby="tab-appearance"
        class="tab-panel"
      >
        <div class="setting-group">
          <h3 class="setting-label">主题模式</h3>
          <p class="setting-description">选择应用的显示主题</p>
          <div class="theme-options">
            <button
              class="theme-option"
              class:selected={$currentMode === ThemeMode.LIGHT}
              on:click={() => setThemeMode(ThemeMode.LIGHT)}
              aria-pressed={$currentMode === ThemeMode.LIGHT}
              aria-label="选择浅色主题"
              type="button"
            >
              <span class="theme-icon light-icon"></span>
              <span class="theme-name">浅色</span>
            </button>
            <button
              class="theme-option"
              class:selected={$currentMode === ThemeMode.DARK}
              on:click={() => setThemeMode(ThemeMode.DARK)}
              aria-pressed={$currentMode === ThemeMode.DARK}
              aria-label="选择深色主题"
              type="button"
            >
              <span class="theme-icon dark-icon"></span>
              <span class="theme-name">深色</span>
            </button>
            <button
              class="theme-option"
              class:selected={$currentMode === ThemeMode.SYSTEM}
              on:click={() => setThemeMode(ThemeMode.SYSTEM)}
              aria-pressed={$currentMode === ThemeMode.SYSTEM}
              aria-label="选择跟随系统主题"
              type="button"
            >
              <span class="theme-icon system-icon"></span>
              <span class="theme-name">跟随系统</span>
            </button>
          </div>
          <p class="setting-hint">当前应用主题：{$appliedTheme === 'dark' ? '深色' : '浅色'}</p>
        </div>

        <div class="setting-group">
          <h3 class="setting-label">自动刷新</h3>
          <p class="setting-description">设置数据自动刷新间隔</p>
          <div class="input-group">
            <select
              bind:value={refreshInterval}
              on:change={saveRefreshSettings}
              class="select-input"
              aria-label="自动刷新间隔"
            >
              <option value={0}>禁用</option>
              <option value={10}>10 秒</option>
              <option value={30}>30 秒</option>
              <option value={60}>1 分钟</option>
              <option value={300}>5 分钟</option>
            </select>
          </div>
        </div>
      </div>
    {/if}

    <!-- 数据设置 -->
    {#if activeTab === 'data'}
      <div
        role="tabpanel"
        id="tab-panel-data"
        aria-labelledby="tab-data"
        class="tab-panel"
      >
        <div class="setting-group">
          <h3 class="setting-label">数据导出</h3>
          <p class="setting-description">导出 Token 使用统计数据</p>

          <div class="export-options">
            <!-- 日期范围 -->
            <div class="date-range">
              <div class="date-field">
                <label for="export-start-date">开始日期</label>
                <input
                  type="date"
                  id="export-start-date"
                  bind:value={exportStartDate}
                  class="date-input"
                />
              </div>
              <div class="date-field">
                <label for="export-end-date">结束日期</label>
                <input
                  type="date"
                  id="export-end-date"
                  bind:value={exportEndDate}
                  class="date-input"
                />
              </div>
            </div>

            <!-- 格式选择 -->
            <div class="format-selection">
              <h4 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">导出格式</h4>
              <div class="format-options" role="radiogroup" aria-label="导出格式选择">
                <label class="format-option">
                  <input
                    type="radio"
                    name="export-format"
                    value={ExportFormat.JSON}
                    bind:group={selectedExportFormat}
                  />
                  <span>JSON</span>
                </label>
                <label class="format-option">
                  <input
                    type="radio"
                    name="export-format"
                    value={ExportFormat.CSV}
                    bind:group={selectedExportFormat}
                  />
                  <span>CSV</span>
                </label>
                <label class="format-option">
                  <input
                    type="radio"
                    name="export-format"
                    value={ExportFormat.EXCEL}
                    bind:group={selectedExportFormat}
                  />
                  <span>Excel</span>
                </label>
              </div>
            </div>

            <!-- 导出按钮 -->
            <button
              class="export-button"
              on:click={handleExport}
              disabled={$exportState.status !== 'idle' && $exportState.status !== 'completed' && $exportState.status !== 'error'}
            >
              {#if $exportState.status === 'preparing'}
                准备中...
              {:else if $exportState.status === 'exporting'}
                导出中 ({$exportState.progress}%)
              {:else if $exportState.status === 'downloading'}
                下载中...
              {:else if $exportState.status === 'completed'}
                导出完成
              {:else if $exportState.status === 'error'}
                重试导出
              {:else}
                导出数据
              {/if}
            </button>

            {#if $exportState.status === 'error'}
              <p class="error-message">{$exportState.errorMessage}</p>
            {/if}

            {#if $exportState.lastFilename}
              <p class="last-export">上次导出：{$exportState.lastFilename}</p>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- 通知设置 -->
    {#if activeTab === 'notifications'}
      <div
        role="tabpanel"
        id="tab-panel-notifications"
        aria-labelledby="tab-notifications"
        class="tab-panel"
      >
        <div class="setting-group">
          <h3 class="setting-label">浏览器通知</h3>
          <p class="setting-description">在重要事件发生时接收通知</p>

          <div class="toggle-setting">
            <label class="toggle-label">
              <input
                type="checkbox"
                bind:checked={notificationsEnabled}
                on:change={() => {
                  if (notificationsEnabled) {
                    requestNotificationPermission();
                  } else {
                    saveNotificationSettings();
                  }
                }}
              />
              <span class="toggle-switch"></span>
              <span>启用通知</span>
            </label>
          </div>
        </div>

        {#if notificationsEnabled}
          <div class="setting-group">
            <h3 class="setting-label">高消耗警告</h3>
            <p class="setting-description">当 Token 使用超过阈值时发送警告</p>
            <div class="input-group">
              <input
                type="number"
                bind:value={highUsageThreshold}
                on:change={saveNotificationSettings}
                min="1000"
                step="10000"
                class="number-input"
                aria-label="高消耗警告阈值"
                aria-describedby="threshold-hint"
              />
              <span id="threshold-hint" class="input-suffix">Token</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- 关于 -->
    {#if activeTab === 'about'}
      <div
        role="tabpanel"
        id="tab-panel-about"
        aria-labelledby="tab-about"
        class="tab-panel"
      >
        <div class="about-content">
          <div class="app-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <h3 class="app-name">Claude Token Monitor</h3>
          <p class="app-version">版本 1.0.0</p>
          <p class="app-description">
            实时监控和分析 Claude Code CLI 的本地 Token 使用情况
          </p>

          <div class="about-links">
            <a href="https://github.com/atlas-oi/claude-token-monitor" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span class="link-separator">|</span>
            <a href="https://docs.anthropic.com" target="_blank" rel="noopener noreferrer">
              Anthropic 文档
            </a>
          </div>

          <div class="credits">
            <p>开发者: Atlas.oi</p>
            <p>使用 Svelte + TypeScript 构建</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /**
   * 设置面板容器
   */
  .settings-panel {
    width: 100%;
    max-width: 600px;
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :global(.dark) .settings-panel {
    background-color: var(--color-surface-800);
  }

  /**
   * 头部
   */
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-surface-200);
  }

  :global(.dark) .settings-header {
    border-color: var(--color-surface-700);
  }

  .settings-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-surface-900);
    margin: 0;
  }

  :global(.dark) .settings-title {
    color: var(--color-surface-50);
  }

  .close-button {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 0.5rem;
    color: var(--color-surface-600);
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: var(--color-surface-100);
    color: var(--color-surface-900);
  }

  :global(.dark) .close-button:hover {
    background-color: var(--color-surface-700);
    color: var(--color-surface-50);
  }

  .close-button svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  /**
   * 标签页导航
   */
  .tabs-nav {
    display: flex;
    border-bottom: 1px solid var(--color-surface-200);
    padding: 0 1rem;
  }

  :global(.dark) .tabs-nav {
    border-color: var(--color-surface-700);
  }

  .tab-button {
    padding: 1rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-surface-600);
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
  }

  .tab-button:hover {
    color: var(--color-surface-900);
  }

  :global(.dark) .tab-button:hover {
    color: var(--color-surface-50);
  }

  .tab-button.active {
    color: var(--color-primary-500);
    border-bottom-color: var(--color-primary-500);
  }

  /**
   * 标签页内容
   */
  .tabs-content {
    padding: 1.5rem;
  }

  .tab-panel {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /**
   * 设置组
   */
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .setting-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-surface-900);
    margin: 0;
  }

  :global(.dark) .setting-label {
    color: var(--color-surface-50);
  }

  .setting-description {
    font-size: 0.875rem;
    color: var(--color-surface-600);
    margin: 0;
  }

  :global(.dark) .setting-description {
    color: var(--color-surface-400);
  }

  .setting-hint {
    font-size: 0.75rem;
    color: var(--color-surface-500);
    margin: 0.5rem 0 0 0;
  }

  /**
   * 主题切换按钮样式
   */
  .theme-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background-color: var(--color-surface-100);
    border: 2px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }

  :global(.dark) .theme-option {
    background-color: var(--color-surface-700);
  }

  .theme-option:hover {
    background-color: var(--color-surface-200);
  }

  :global(.dark) .theme-option:hover {
    background-color: var(--color-surface-600);
  }

  .theme-option.selected {
    border-color: var(--color-primary-500);
  }

  /* 键盘导航焦点样式 */
  .theme-option:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  .theme-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }

  .light-icon {
    background: linear-gradient(135deg, #fef9c3, #fef08a);
    box-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
  }

  .dark-icon {
    background: linear-gradient(135deg, #374151, #1f2937);
    box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.1);
  }

  .system-icon {
    background: linear-gradient(135deg, #fef9c3 50%, #374151 50%);
  }

  .theme-name {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-surface-700);
  }

  :global(.dark) .theme-name {
    color: var(--color-surface-300);
  }

  /**
   * 输入组
   */
  .input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .select-input,
  .number-input,
  .date-input {
    padding: 0.625rem 1rem;
    background-color: var(--color-surface-100);
    border: 1px solid var(--color-surface-300);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-surface-900);
  }

  :global(.dark) .select-input,
  :global(.dark) .number-input,
  :global(.dark) .date-input {
    background-color: var(--color-surface-700);
    border-color: var(--color-surface-600);
    color: var(--color-surface-50);
  }

  .input-suffix {
    font-size: 0.875rem;
    color: var(--color-surface-600);
  }

  /**
   * 导出选项
   */
  .export-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .date-range {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .date-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .date-field label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-surface-600);
  }

  :global(.dark) .date-field label {
    color: var(--color-surface-400);
  }

  .format-selection {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .format-selection label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-surface-600);
  }

  :global(.dark) .format-selection > label {
    color: var(--color-surface-400);
  }

  .format-options {
    display: flex;
    gap: 1rem;
  }

  .format-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-surface-700);
    cursor: pointer;
  }

  :global(.dark) .format-option {
    color: var(--color-surface-300);
  }

  .export-button {
    padding: 0.75rem 1.5rem;
    background-color: var(--color-primary-500);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .export-button:hover:not(:disabled) {
    background-color: var(--color-primary-600);
  }

  .export-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    font-size: 0.75rem;
    color: rgb(239, 68, 68);
    margin: 0;
  }

  .last-export {
    font-size: 0.75rem;
    color: var(--color-surface-500);
    margin: 0;
  }

  /**
   * 开关设置
   */
  .toggle-setting {
    margin-top: 0.5rem;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-surface-700);
  }

  :global(.dark) .toggle-label {
    color: var(--color-surface-300);
  }

  .toggle-label input {
    display: none;
  }

  .toggle-switch {
    position: relative;
    width: 2.5rem;
    height: 1.5rem;
    background-color: var(--color-surface-300);
    border-radius: 9999px;
    transition: background-color 0.2s;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 1.25rem;
    height: 1.25rem;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .toggle-label input:checked + .toggle-switch {
    background-color: var(--color-primary-500);
  }

  .toggle-label input:checked + .toggle-switch::after {
    transform: translateX(1rem);
  }

  /**
   * 关于页面
   */
  .about-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
    padding: 2rem 0;
  }

  .app-logo {
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
    border-radius: 1rem;
    color: white;
  }

  .app-logo svg {
    width: 2.5rem;
    height: 2.5rem;
  }

  .app-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0;
  }

  :global(.dark) .app-name {
    color: var(--color-surface-50);
  }

  .app-version {
    font-size: 0.875rem;
    color: var(--color-surface-500);
    margin: 0;
  }

  .app-description {
    font-size: 0.875rem;
    color: var(--color-surface-600);
    margin: 0;
    max-width: 300px;
  }

  :global(.dark) .app-description {
    color: var(--color-surface-400);
  }

  .about-links {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .about-links a {
    color: var(--color-primary-500);
    text-decoration: none;
  }

  .about-links a:hover {
    text-decoration: underline;
  }

  .link-separator {
    color: var(--color-surface-400);
  }

  .credits {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-surface-200);
  }

  :global(.dark) .credits {
    border-color: var(--color-surface-700);
  }

  /* 屏幕阅读器专用 */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .credits p {
    font-size: 0.75rem;
    color: var(--color-surface-500);
    margin: 0.25rem 0;
  }
</style>
