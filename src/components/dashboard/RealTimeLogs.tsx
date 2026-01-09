import { useAppStore } from '../../store';

export function RealTimeLogs() {
  const { logs } = useAppStore();

  return (
    <div className="bento-card h-full flex flex-col overflow-hidden animate-slide-up delay-400">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="font-display text-sm font-medium text-primary">实时日志</h3>
        <span className="text-[10px] font-mono text-secondary/50">LATEST 50</span>
      </div>
      
      <div className="flex-1 overflow-y-auto relative">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel/95 backdrop-blur sticky top-0 z-10 text-[10px] font-mono uppercase text-secondary">
            <tr>
              <th className="px-4 py-2 font-medium w-20">时间</th>
              <th className="px-2 py-2 font-medium w-24">模型</th>
              <th className="px-2 py-2 font-medium">上下文</th>
              <th className="px-4 py-2 font-medium text-right w-20">费用</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-secondary whitespace-nowrap">
                  {log.timestamp}
                </td>
                <td className="px-2 py-2.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-neonPrimary/10 text-neonPrimary border border-neonPrimary/20 whitespace-nowrap">
                    {log.model.split(' ').pop()} {/* 简化显示，如 "3.5" */}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-xs text-primary truncate" title={log.context}>
                   {log.context}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs text-white group-hover:text-neonPrimary transition-colors whitespace-nowrap">
                  ¥{log.cost.toFixed(3)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-secondary text-xs">
                  暂无日志数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}