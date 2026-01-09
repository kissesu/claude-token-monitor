/**
 * @file ModelUsagePanel.tsx
 * @description 模型使用详情面板，展示各模型的 Token 消耗、缓存命中率和费用
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { useAppStore } from '../../store';
import { DataTable } from '../common/DataTable';
import { ModelUsage } from '../../types/tauri';
import { formatCompactNumber } from '../../lib/utils';

export function ModelUsagePanel() {
  const { stats } = useAppStore();
  const models = (stats?.models || []).filter((model) => model.model !== '<synthetic>');

  const columns = [
    {
      header: '模型名称',
      render: (m: ModelUsage) => (
        <span className="font-medium text-primary">{m.model}</span>
      ),
      className: 'w-48',
    },
    {
      header: '输入 (Input)',
      render: (m: ModelUsage) => formatCompactNumber(m.input_tokens),
    },
    {
      header: '输出 (Output)',
      render: (m: ModelUsage) => formatCompactNumber(m.output_tokens),
    },
    {
      header: '缓存读取',
      render: (m: ModelUsage) => formatCompactNumber(m.cache_read_tokens),
    },
    {
      header: '缓存命中率',
      render: (m: ModelUsage) => {
        const totalTokens = m.cache_read_tokens + m.input_tokens;
        const hitRate = totalTokens > 0 ? m.cache_read_tokens / totalTokens : 0;
        return `${(hitRate * 100).toFixed(1)}%`;
      },
    },
    {
      header: '消息数',
      render: (m: ModelUsage) => m.message_count.toLocaleString(),
      className: 'text-secondary',
    },
    {
      header: '费用',
      render: (m: ModelUsage) => (
        <span className="font-mono text-neonPrimary">¥{(m.cost_usd * 7.2).toFixed(3)}</span>
      ),
      className: 'text-right font-mono',
    },
  ];

  return (
    <DataTable
      title="模型使用详情"
      columns={columns}
      data={models}
      keyExtractor={(m) => m.model}
      className="animate-slide-up delay-400 min-h-[250px]"
    />
  );
}
