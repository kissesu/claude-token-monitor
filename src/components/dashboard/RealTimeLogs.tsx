import { useAppStore } from '../../store';

export function RealTimeLogs() {
  const { logs } = useAppStore();

  return (
    <div className="bento-card overflow-hidden animate-slide-up delay-400">
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-display text-sm font-medium text-primary">实时日志</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-[10px] font-mono uppercase text-secondary">
          <tr>
            <th className="px-6 py-3 font-medium">时间</th>
            <th className="px-6 py-3 font-medium">模型</th>
            <th className="px-6 py-3 font-medium">会话上下文</th>
            <th className="px-6 py-3 font-medium text-right">费用</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {logs.map((log) => (
            <tr key={log.id} className="group hover:bg-white/5 transition-colors">
              <td className="px-6 py-3 font-mono text-xs text-secondary">{log.timestamp}</td>
              <td className="px-6 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neonPrimary/10 text-neonPrimary border border-neonPrimary/20">
                  {log.model}
                </span>
              </td>
              <td className="px-6 py-3 text-xs text-primary">
                {/* Splitting context by / for styling if needed, or just display */}
                {log.context.split(' / ').map((part, i, arr) => (
                  <span key={i}>
                    {i > 0 && ' / '}
                    <span className={i === arr.length - 1 ? 'text-secondary' : 'text-primary'}>
                      {part}
                    </span>
                  </span>
                ))}
              </td>
              <td className="px-6 py-3 text-right font-mono text-xs text-white group-hover:text-neonPrimary transition-colors">
                ¥{log.cost.toFixed(3)}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-secondary text-xs">
                暂无日志数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
