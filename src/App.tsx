import { useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Providers } from './pages/Providers';
import { Settings } from './pages/Settings';
import { Logs } from './pages/Logs';
import { useAppStore } from './store';
import { useResponsiveScale } from './hooks/useResponsiveScale';
import { useTauriEvents } from './hooks/useTauriEvents';
import './index.css';

function AppContent() {
  useResponsiveScale(1280, 16);
  const { fetchStats } = useAppStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 监听 Tauri 事件
  const handlers = useMemo(() => ({
    onFileChanged: () => {
      console.log('文件变更，正在刷新统计...');
      fetchStats();
    }
  }), [fetchStats]);

  useTauriEvents(handlers);

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;