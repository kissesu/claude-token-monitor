import { ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { useAppStore } from '../../store';

export function FlowChart() {
  const { stats } = useAppStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-3 animate-slide-up delay-200">
        <h3 className="font-display text-sm font-medium text-primary mb-1">流量详情</h3>
        
        <div className="p-3 rounded-lg border border-border/50 bg-panel/50 hover:bg-panel transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-neonBlue/10 flex items-center justify-center text-neonBlue border border-neonBlue/20">
              <ArrowDown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-secondary">输入 (Input)</div>
              <div className="text-sm font-medium text-white">{stats?.total_input_tokens.toLocaleString()}</div>
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
              <div className="text-sm font-medium text-white">{stats?.total_output_tokens.toLocaleString()}</div>
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
              <div className="text-sm font-medium text-white">{stats?.total_cache_read_tokens.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 bento-card p-6 min-h-[300px] animate-slide-up delay-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-sm font-medium text-primary">使用趋势</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-neonPrimary"></span> Sonnet 3.5
            </div>
          </div>
        </div>
        <div className="w-full h-[220px] flex items-end justify-between gap-1 relative z-10">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="w-full h-px bg-white/5 border-t border-dashed border-white/5"></div>
            <div className="w-full h-px bg-white/5 border-t border-dashed border-white/5"></div>
            <div className="w-full h-px bg-white/5 border-t border-dashed border-white/5"></div>
          </div>
          {/* Mock Bars */}
          <div className="w-full bg-white/5 rounded-t h-[20%]"></div>
          <div className="w-full bg-white/5 rounded-t h-[35%]"></div>
          <div className="w-full bg-neonPrimary rounded-t h-[80%] shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
          <div className="w-full bg-white/5 rounded-t h-[40%]"></div>
          <div className="w-full bg-white/5 rounded-t h-[55%]"></div>
        </div>
      </div>
    </div>
  );
}
