/**
 * @file Logs.tsx
 * @description 日志页面，展示实时请求日志列表，支持搜索过滤
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { useAppStore } from '../store';
import { DataTable } from '../components/common/DataTable';
import { LogEntry } from '../types/store';
import { Search } from 'lucide-react';

export function Logs() {
  const { logs } = useAppStore();

  const columns = [
    {
      header: '时间',
      render: (log: LogEntry) => (
        <span className="font-mono text-xs text-secondary whitespace-nowrap">{log.timestamp}</span>
      ),
      className: 'w-32',
    },
    {
      header: '模型',
      render: (log: LogEntry) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neonPrimary/10 text-neonPrimary border border-neonPrimary/20">
          {log.model}
        </span>
      ),
      className: 'w-48',
    },
    {
      header: '会话上下文',
      render: (log: LogEntry) => (
        <span className="text-sm text-primary font-mono truncate block max-w-xl" title={log.context}>
          {log.context}
        </span>
      ),
      className: 'min-w-[300px]',
    },
    {
      header: '费用估算',
      render: (log: LogEntry) => (
        <span className="font-mono text-sm text-primary">¥{log.cost.toFixed(4)}</span>
      ),
      className: 'text-right w-32',
    },
  ];

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {/* Search Bar / Filters (Placeholder for future) */}
      <div className="flex items-center gap-4 shrink-0 animate-slide-up delay-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input 
            type="text" 
            placeholder="搜索上下文、模型..." 
            className="w-full bg-panel border border-border/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-secondary/50 focus:outline-none focus:border-neonPrimary/50 transition-colors"
          />
        </div>
        <div className="text-xs text-secondary font-mono ml-auto">
          Total {logs.length} entries
        </div>
      </div>

      {/* Full Screen Table */}
      <div className="flex-1 min-h-0 animate-slide-up delay-200">
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(log) => log.id}
          className="h-full border-t border-border/50 rounded-t-xl"
          emptyText="暂无实时日志数据"
        />
      </div>
    </div>
  );
}
