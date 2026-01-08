import { useEffect, useState, type ReactNode } from 'react';
import { Aperture, LayoutGrid, BarChart2, Layers, ChevronDown, Sun, Moon } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="bg-bg text-secondary h-screen w-screen overflow-hidden font-sans selection:bg-neonPrimary/20 selection:text-neonPrimary relative">
      <div className="absolute inset-0 z-0 bg-noise pointer-events-none opacity-40"></div>
      <div className="absolute inset-0 z-0 bg-gradient-glow pointer-events-none"></div>

      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <aside className="w-[68px] flex flex-col items-center py-6 border-r border-border/50 bg-bg/80 backdrop-blur-sm relative z-10">
          <div className="w-10 h-10 rounded-xl bg-neonPrimary/10 flex items-center justify-center mb-8 border border-neonPrimary/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Aperture className="w-6 h-6 text-neonPrimary" />
          </div>
          <nav className="flex flex-col gap-4 w-full px-2">
            <a href="#" className="w-full aspect-square rounded-lg flex items-center justify-center bg-white/5 text-primary shadow-sm border border-white/5 transition-all">
              <LayoutGrid className="w-5 h-5 text-neonPrimary" />
            </a>
            <a href="#" className="w-full aspect-square rounded-lg flex items-center justify-center text-secondary hover:bg-white/5 hover:text-primary transition-all">
              <BarChart2 className="w-5 h-5" />
            </a>
            <a href="#" className="w-full aspect-square rounded-lg flex items-center justify-center text-secondary hover:bg-white/5 hover:text-primary transition-all">
              <Layers className="w-5 h-5" />
            </a>
          </nav>
          <div className="mt-auto flex flex-col gap-4 items-center">
            <button className="w-10 h-10 rounded-full bg-panel border border-border flex items-center justify-center hover:border-neonPrimary/50 transition-colors relative">
              <span className="font-mono text-xs font-bold text-white">OI</span>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-bg rounded-full"></span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="h-16 flex items-center justify-between px-8 shrink-0 animate-fade-in">
            <div>
              <h1 className="font-display text-xl font-medium text-primary tracking-tight">仪表盘</h1>
              <div className="flex items-center gap-2 text-xs text-secondary/60 font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                实时监控中
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-3 px-4 py-2 rounded-full bg-panel border border-border hover:border-white/20 transition-all group">
                <div className="w-2 h-2 rounded-full bg-neonPrimary"></div>
                <span className="text-xs font-medium text-white group-hover:text-neonPrimary transition-colors">个人 API Key</span>
                <ChevronDown className="w-3 h-3 text-secondary" />
              </button>
              <button 
                onClick={() => setIsDark(!isDark)}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4 text-secondary" /> : <Moon className="w-4 h-4 text-secondary" />}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="max-w-6xl mx-auto space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
