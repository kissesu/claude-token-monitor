import { ArrowDown, ArrowUp, Zap, Database } from 'lucide-react';
import { useAppStore } from '../../store';
import { formatCompactNumber } from '../../lib/utils';

export function TrafficDetails() {
  const { todayStats } = useAppStore();

  return (
    <div className="animate-slide-up delay-200">
      <h3 className="font-display text-sm font-medium text-primary mb-3">流量详情</h3>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 rounded-lg border border-border bg-panel/50 hover:bg-panel transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neonBlue/10 flex items-center justify-center text-neonBlue border border-neonBlue/20">
              <ArrowDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-secondary">输入 (Input)</div>
              <div className="text-sm font-medium text-primary">
                {todayStats ? formatCompactNumber(todayStats.input_tokens) : '0'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-panel/50 hover:bg-panel transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neonPurple/10 flex items-center justify-center text-neonPurple border border-neonPurple/20">
              <ArrowUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-secondary">输出 (Output)</div>
              <div className="text-sm font-medium text-primary">
                {todayStats ? formatCompactNumber(todayStats.output_tokens) : '0'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-neonPrimary/20 bg-neonPrimary/5 hover:bg-neonPrimary/10 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neonPrimary/20 flex items-center justify-center text-neonPrimary border border-neonPrimary/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-neonPrimary">缓存读取 (Hit)</div>
              <div className="text-sm font-medium text-primary">
                {todayStats ? formatCompactNumber(todayStats.cache_read_tokens) : '0'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-cyan-400">缓存写入 (Write)</div>
              <div className="text-sm font-medium text-primary">
                {todayStats ? formatCompactNumber(todayStats.cache_creation_tokens) : '0'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
