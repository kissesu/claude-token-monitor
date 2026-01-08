import { useState } from 'react';
import { Check, MoreHorizontal, Key, Calendar, DollarSign, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

// Mock Data
const MOCK_PROVIDERS = [
  { id: 1, name: '工作账号 (Company)', prefix: 'sk-ant-api03', active: true, usage: '450K', cost: 12.50, lastSeen: 'Just now' },
  { id: 2, name: '个人开发 (Personal)', prefix: 'sk-ant-cw92', active: false, usage: '120K', cost: 3.20, lastSeen: '2 hours ago' },
  { id: 3, name: '测试环境 (Test)', prefix: 'sk-ant-test', active: false, usage: '25K', cost: 0.80, lastSeen: '3 days ago' },
];

export function Providers() {
  const [activeId, setActiveId] = useState(1);

  return (
    <div className="h-full flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar">
      
      {/* Header Section */}
      <div className="flex items-center justify-between shrink-0 animate-slide-up delay-100">
        <div>
          <h2 className="font-display text-lg font-medium text-primary">供应商管理</h2>
          <p className="text-xs text-secondary mt-1">管理 API Key 及查看分账统计</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-neonPrimary/10 border border-neonPrimary/20 text-neonPrimary text-sm font-medium hover:bg-neonPrimary/20 transition-colors flex items-center gap-2">
          <Key className="w-4 h-4" />
          添加新 Key
        </button>
      </div>

      {/* Active Provider Banner */}
      <div className="bento-card p-6 flex items-center justify-between bg-gradient-to-r from-panel to-neonPrimary/5 border-neonPrimary/20 animate-slide-up delay-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-neonPrimary/20 flex items-center justify-center border border-neonPrimary/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Check className="w-6 h-6 text-neonPrimary" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-neonPrimary mb-1">当前活跃 (Active)</div>
            <div className="text-xl font-display font-medium text-white">工作账号 (Company)</div>
            <div className="text-xs text-secondary font-mono mt-0.5">sk-ant-api03...8f92</div>
          </div>
        </div>
        <div className="flex gap-8 text-right">
          <div>
             <div className="text-[10px] text-secondary uppercase mb-1">今日消耗</div>
             <div className="text-lg font-mono text-white">¥12.50</div>
          </div>
          <div>
             <div className="text-[10px] text-secondary uppercase mb-1">Token</div>
             <div className="text-lg font-mono text-white">450K</div>
          </div>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up delay-300">
        {MOCK_PROVIDERS.map((provider) => (
          <div 
            key={provider.id}
            onClick={() => setActiveId(provider.id)}
            className={cn(
              "bento-card p-6 flex flex-col gap-4 group cursor-pointer hover:bg-white/5",
              provider.id === activeId ? "ring-1 ring-neonPrimary/50" : ""
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center border",
                  provider.active 
                    ? "bg-neonPrimary/10 border-neonPrimary/20 text-neonPrimary" 
                    : "bg-white/5 border-white/10 text-secondary"
                )}>
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className={cn("text-sm font-medium", provider.active ? "text-white" : "text-secondary group-hover:text-white transition-colors")}>
                    {provider.name}
                  </div>
                  <div className="text-[10px] font-mono text-secondary/60">{provider.prefix}...</div>
                </div>
              </div>
              <button className="text-secondary hover:text-white transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="h-px bg-white/5 w-full"></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-secondary flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" /> 总费用
                </span>
                <span className="font-mono text-sm text-white">¥{provider.cost.toFixed(2)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-secondary flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> 使用量
                </span>
                <span className="font-mono text-sm text-white">{provider.usage}</span>
              </div>
              <div className="flex flex-col gap-1 col-span-2 mt-2">
                <span className="text-[10px] text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> 上次活跃
                </span>
                <span className="font-mono text-xs text-emerald-400">{provider.lastSeen}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Card Placeholder */}
        <div className="bento-card border-dashed border-white/10 flex flex-col items-center justify-center gap-3 min-h-[200px] hover:border-neonPrimary/30 hover:bg-neonPrimary/5 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
             <Key className="w-5 h-5 text-secondary group-hover:text-neonPrimary transition-colors" />
          </div>
          <span className="text-xs font-medium text-secondary group-hover:text-neonPrimary transition-colors">添加新的 API Key</span>
        </div>
      </div>

    </div>
  );
}
