import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { KPIGrid } from './components/dashboard/KPIGrid';
import { FlowChart } from './components/dashboard/FlowChart';
import { RealTimeLogs } from './components/dashboard/RealTimeLogs';
import { useAppStore } from './store';
import './index.css';

function App() {
  const { fetchStats } = useAppStore();

  useEffect(() => {
    fetchStats();
    // Set up polling or event listener here later
  }, [fetchStats]);

  return (
    <AppLayout>
      <KPIGrid />
      <FlowChart />
      <RealTimeLogs />
    </AppLayout>
  );
}

export default App;