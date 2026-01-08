import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { KPIGrid } from './components/dashboard/KPIGrid';
import { FlowChart } from './components/dashboard/FlowChart';
import { TrafficDetails } from './components/dashboard/TrafficDetails';
import { RealTimeLogs } from './components/dashboard/RealTimeLogs';
import { useAppStore } from './store';
import { useResponsiveScale } from './hooks/useResponsiveScale';
import './index.css';

function App() {
  // 启用响应式缩放
  useResponsiveScale(1280, 16);
  const { fetchStats } = useAppStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <AppLayout>
      {/* 锁定高度，禁用外部滚动 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full overflow-hidden pb-6">
        
        {/* 左侧区域 (2/3 宽度) */}
        <div className="xl:col-span-2 flex flex-col gap-8 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* KPI 卡片行 */}
          <section className="shrink-0">
            <KPIGrid />
          </section>

          {/* 流量详情行 */}
          <section className="shrink-0">
            <TrafficDetails />
          </section>
          
          {/* 使用趋势图表行 */}
          <section className="shrink-0">
             <FlowChart />
          </section>
          
          <div className="flex-1"></div>
        </div>

        {/* 右侧区域 (1/3 宽度)：增加宽度后的实时日志 */}
        <div className="xl:col-span-1 h-full min-h-0">
          <RealTimeLogs />
        </div>

      </div>
    </AppLayout>
  );
}

export default App;