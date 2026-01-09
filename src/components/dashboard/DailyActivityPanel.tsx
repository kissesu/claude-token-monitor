/**
 * @file DailyActivityPanel.tsx
 * @description 每日活动面板，展示最近 7 天的 Token 使用和费用统计
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { useAppStore } from '../../store';
import { DataTable } from '../common/DataTable';
import { DailyActivity } from '../../types/tauri';
import { formatCompactNumber } from '../../lib/utils';

export function DailyActivityPanel() {
  const { dailyActivities } = useAppStore();

  const columns = [
    {
      header: '日期',
      render: (d: DailyActivity) => (
        <span className="font-mono text-xs">{d.date}</span>
      ),
      className: 'w-32',
    },
    {
      header: '输入',
      render: (d: DailyActivity) => formatCompactNumber(d.input_tokens),
    },
    {
      header: '输出',
      render: (d: DailyActivity) => formatCompactNumber(d.output_tokens),
    },
    {
      header: '费用',
      render: (d: DailyActivity) => (
        <span className="text-primary">¥{(d.cost_usd * 7.2).toFixed(2)}</span>
      ),
      className: 'text-right font-mono',
    },
  ];

  return (
    <DataTable
      title="最近每日活动"
      columns={columns}
      data={[...dailyActivities].reverse().slice(0, 7)}
      keyExtractor={(d) => d.date}
      className="animate-slide-up delay-500 min-h-[200px]"
    />
  );
}
