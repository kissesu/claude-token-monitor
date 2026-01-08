import { useAppStore } from '../../store';

export function FlowChart() {
  const { dailyActivities } = useAppStore();
  const recentActivities = dailyActivities.slice(-5);
  // 计算最大值用于归一化图表高度
  const activityTotals = recentActivities.map(
    (activity) => activity.input_tokens + activity.output_tokens
  );
  const maxTotal = activityTotals.length > 0 ? Math.max(...activityTotals, 1) : 1;

  return (
    <div className="bento-card p-6 h-[18.75rem] animate-slide-up delay-300 flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="font-display text-sm font-medium text-primary">使用趋势</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-secondary">
            <span className="w-2 h-2 rounded-full bg-neonPrimary"></span> Sonnet 3.5
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="w-full flex-1 flex items-end justify-between gap-1 relative z-10 min-h-[12.5rem]">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="w-full h-px bg-white/5 border-t border-dashed border-white/5"></div>
          <div className="w-full h-px bg-white/5 border-t border-dashed border-white/5"></div>
          <div className="w-full h-px bg-white/5 border-t border-dashed border-white/5"></div>
        </div>
        {(recentActivities.length > 0 ? recentActivities : new Array(5).fill(null)).map(
          (activity, index) => {
            const total = activity ? activity.input_tokens + activity.output_tokens : 0;
            const height = Math.max(8, Math.round((total / maxTotal) * 100));
            const isPeak = total === maxTotal && total > 0;
            
            return (
              <div
                key={activity ? activity.date : `placeholder-${index}`}
                className={`w-full rounded-t transition-all duration-500 ${
                  isPeak 
                    ? 'bg-neonPrimary shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                style={{ height: `${height}%` }}
              ></div>
            );
          }
        )}
      </div>
    </div>
  );
}