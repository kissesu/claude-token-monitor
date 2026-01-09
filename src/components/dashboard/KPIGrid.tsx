import { DollarSign, Zap, Database, Activity } from 'lucide-react';
import { useAppStore } from '../../store';
import { StatCard } from '../common/StatCard';
import { formatCompactNumber } from '../../lib/utils';

export function KPIGrid() {
  const { todayStats, stats } = useAppStore();

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="今日预估费用"
        value={`¥${todayStats?.cost_usd ? (todayStats.cost_usd * 7.2).toFixed(2) : '0.00'}`}
        icon={DollarSign}
        trend={{ value: '环比 +12%', isPositive: true }}
        delayClass="delay-100"
      />

      <StatCard
        title="Token 总量"
        value={todayStats ? formatCompactNumber(todayStats.input_tokens + todayStats.output_tokens) : '0'}
        icon={Zap}
        iconColorClass="text-neonBlue"
        subValue="今日消耗"
        delayClass="delay-200"
      />

      <StatCard
        title="缓存命中率"
        value={todayStats ? `${(todayStats.cache_hit_rate * 100).toFixed(1)}%` : '0.0%'}
        icon={Database}
        iconColorClass="text-neonGreen"
        subValue={`今日节省 ¥${(todayStats?.cost_usd ? todayStats.cost_usd * todayStats.cache_hit_rate * 7.2 : 0).toFixed(2)}`}
        delayClass="delay-300"
        className="ring-1 ring-neonGreen/20"
      />

      <StatCard
        title="活跃会话"
        value={stats?.total_sessions || 0}
        icon={Activity}
        iconColorClass="text-secondary"
        subValue="监控中"
        delayClass="delay-400"
      />
    </div>
  );
}
