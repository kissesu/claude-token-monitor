import { ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { useAppStore } from '../../store';

export function TrafficDetails() {
  const { todayStats } = useAppStore();

  return (
    <div className="animate-slide-up delay-200">
      <h3 className="font-display text-sm font-medium text-primary mb-3">流量详情</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg border border-border/50 bg-panel/50 hover:bg-panel transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neonBlue/10 flex items-center justify-center text-neonBlue border border-neonBlue/20">
              <ArrowDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-secondary">输入 (Input)</div>
              <div className="text-sm font-medium text-white">
                {todayStats ? todayStats.input_tokens.toLocaleString() : '0'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/50 bg-panel/50 hover:bg-panel transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neonPurple/10 flex items-center justify-center text-neonPurple border border-neonPurple/20">
              <ArrowUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-secondary">输出 (Output)</div>
              <div className="text-sm font-medium text-white">
                {todayStats ? todayStats.output_tokens.toLocaleString() : '0'}
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
              <div className="text-sm font-medium text-white">
                {todayStats ? todayStats.cache_read_tokens.toLocaleString() : '0'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}