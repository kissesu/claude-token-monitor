/**
 * @file DataTable.tsx
 * @description 通用数据表格组件，支持自定义列渲染、滚动和空状态提示
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  className?: string;
  emptyText?: string;
}

export function DataTable<T>({
  title,
  columns,
  data,
  keyExtractor,
  className,
  emptyText = '暂无数据',
}: DataTableProps<T>) {
  return (
    <div className={cn("bento-card overflow-hidden flex flex-col", className)}>
      {title && (
        <div className="px-5 py-4 border-b border-border/50 shrink-0">
          <h3 className="font-display text-sm font-medium text-primary">{title}</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel/95 backdrop-blur sticky top-0 z-10 text-[10px] font-mono uppercase text-secondary">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={cn("px-4 py-2 font-medium", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="group hover:bg-white/5 transition-colors">
                {columns.map((col, i) => (
                  <td key={i} className={cn("px-4 py-2.5", col.className)}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-secondary text-xs">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
