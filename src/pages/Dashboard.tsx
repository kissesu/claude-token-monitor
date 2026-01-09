import { KPIGrid } from '../components/dashboard/KPIGrid';
import { FlowChart } from '../components/dashboard/FlowChart';
import { TrafficDetails } from '../components/dashboard/TrafficDetails';
import { ModelUsagePanel } from '../components/dashboard/ModelUsagePanel';
import { DailyActivityPanel } from '../components/dashboard/DailyActivityPanel';

export function Dashboard() {
  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar pb-6">
      
      {/* KPI 核心指标 */}
      <section className="shrink-0">
        <KPIGrid />
      </section>

      {/* 流量详情与趋势图表 */}
      <section className="grid grid-cols-1 xl:grid-cols-4 gap-8 shrink-0">
        {/* 流量详情：横向排列的卡片 */}
        <div className="xl:col-span-4">
          <TrafficDetails />
        </div>
        
        {/* 使用趋势：全宽图表 */}
        <div className="xl:col-span-4 h-[22rem]">
           <FlowChart />
        </div>
      </section>

      {/* 详细数据表格 */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 shrink-0">
         <ModelUsagePanel />
         <DailyActivityPanel />
      </section>
      
      <div className="flex-1"></div>
    </div>
  );
}