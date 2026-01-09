/**
 * @file StatCard.tsx
 * @description 统计卡片组件，用于展示单个 KPI 指标，支持图标、趋势和子值显示
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  delayClass?: string;
}

export function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  iconColorClass = 'text-neonPrimary',
  trend,
  className,
  delayClass = 'delay-100',
}: StatCardProps) {
  return (
    <div className={cn(
      "bento-card p-6 flex flex-col justify-between h-[8.75rem] animate-slide-up group",
      delayClass,
      className
    )}>
      <div className="flex justify-between items-start">
        <span className="font-mono text-[10px] uppercase tracking-wider text-secondary">{title}</span>
        <Icon className={cn("w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity", iconColorClass)} />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-display font-medium text-primary">{value}</span>
        </div>
        {(trend || subValue) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span className={cn(
                "px-1.5 py-0.5 rounded border text-[10px] font-mono",
                trend.isPositive 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              )}>
                {trend.value}
              </span>
            )}
            {subValue && <span className="text-[11px] text-secondary font-mono">{subValue}</span>}
          </div>
        )}
      </div>
      <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity", iconColorClass.replace('text-', 'bg-') + '/10')}></div>
    </div>
  );
}
