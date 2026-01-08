import { DollarSign, Zap, Database, Activity } from 'lucide-react';
import { useAppStore } from '../../store';

export function KPIGrid() {
  const { stats } = useAppStore();

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bento-card p-6 flex flex-col justify-between h-[140px] animate-slide-up delay-100 group">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-wider text-secondary">今日预估费用</span>
          <DollarSign className="w-4 h-4 text-neonPrimary opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-display font-medium text-white">
              ¥{stats?.total_cost_usd ? (stats.total_cost_usd * 7.2).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">环比 +12%</span>
          </div>
        </div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-neonPrimary/5 rounded-full blur-2xl group-hover:bg-neonPrimary/10 transition-colors"></div>
      </div>

      <div className="bento-card p-6 flex flex-col justify-between h-[140px] animate-slide-up delay-200 group">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-wider text-secondary">Token 总量</span>
          <Zap className="w-4 h-4 text-neonBlue opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <div className="text-3xl font-display font-medium text-white">
            {stats ? ((stats.total_input_tokens + stats.total_output_tokens) / 1000000).toFixed(1) + 'M' : '0'}
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden flex">
            <div className="h-full bg-neonBlue w-[65%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            <div className="h-full bg-neonPurple w-[35%]"></div>
          </div>
        </div>
      </div>

      <div className="bento-card p-6 flex flex-col justify-between h-[140px] animate-slide-up delay-300 group ring-1 ring-neonGreen/20">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neonGreen">缓存节省</span>
          <Database className="w-4 h-4 text-neonGreen opacity-100 animate-pulse-slow" />
        </div>
        <div>
          <div className="text-3xl font-display font-medium text-white">
            {stats ? (stats.cache_hit_rate * 100).toFixed(1) : '0'}%
          </div>
          <div className="mt-3 text-xs text-neonGreen font-mono border-t border-border/50 pt-2 flex items-center gap-2">
            今日节省 ¥8.40
          </div>
        </div>
        <div className="absolute inset-0 bg-neonGreen/5 pointer-events-none"></div>
      </div>

      <div className="bento-card p-6 flex flex-col justify-between h-[140px] animate-slide-up delay-400 group">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-wider text-secondary">活跃会话</span>
          <Activity className="w-4 h-4 text-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <div className="text-3xl font-display font-medium text-white">
            {stats?.total_sessions || 0}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-secondary">监控中</span>
          </div>
        </div>
      </div>
    </div>
  );
}
