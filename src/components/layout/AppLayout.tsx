import { type ReactNode, useState, useEffect, useRef } from 'react';
import { Aperture, LayoutGrid, Layers, ChevronDown, Sun, Moon, Settings as SettingsIcon, ScrollText, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { providers, activeProviderId } = useAppStore();
  const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
  const providerMenuRef = useRef<HTMLDivElement>(null);

  const activeProvider = providers.find(p => p.id === activeProviderId);
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (providerMenuRef.current && !providerMenuRef.current.contains(event.target as Node)) {
        setIsProviderMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    // 简单切换：System -> Dark -> Light -> System
    if (theme === 'system') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('system');
  };

  return (
    <div className="bg-bg text-secondary h-screen w-screen overflow-hidden font-sans selection:bg-neonPrimary/20 selection:text-neonPrimary relative">
      <div className="absolute inset-0 z-0 bg-noise pointer-events-none opacity-40"></div>
      <div className="absolute inset-0 z-0 bg-gradient-glow pointer-events-none"></div>

      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <aside className="w-[4.25rem] flex flex-col items-center py-6 border-r border-border/50 bg-bg/80 backdrop-blur-sm relative z-10">
          <div className="w-10 h-10 rounded-xl bg-neonPrimary/10 flex items-center justify-center mb-8 border border-neonPrimary/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Aperture className="w-6 h-6 text-neonPrimary" />
          </div>
          <nav className="flex flex-col gap-4 w-full px-2">
            <Link to="/" className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${isActive('/') ? 'bg-white/5 text-primary shadow-sm border border-white/5' : 'text-secondary hover:bg-white/5 hover:text-primary'}`}>
              <LayoutGrid className={`w-5 h-5 ${isActive('/') ? 'text-neonPrimary' : ''}`} />
            </Link>
            <Link to="/providers" className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${isActive('/providers') ? 'bg-white/5 text-primary shadow-sm border border-white/5' : 'text-secondary hover:bg-white/5 hover:text-primary'}`}>
              <Layers className={`w-5 h-5 ${isActive('/providers') ? 'text-neonPrimary' : ''}`} />
            </Link>
            <Link to="/logs" className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${isActive('/logs') ? 'bg-white/5 text-primary shadow-sm border border-white/5' : 'text-secondary hover:bg-white/5 hover:text-primary'}`}>
              <ScrollText className={`w-5 h-5 ${isActive('/logs') ? 'text-neonPrimary' : ''}`} />
            </Link>
            <Link to="/settings" className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${isActive('/settings') ? 'bg-white/5 text-primary shadow-sm border border-white/5' : 'text-secondary hover:bg-white/5 hover:text-primary'}`}>
              <SettingsIcon className={`w-5 h-5 ${isActive('/settings') ? 'text-neonPrimary' : ''}`} />
            </Link>
          </nav>
          <div className="mt-auto flex flex-col gap-4 items-center">
            <button className="w-10 h-10 rounded-full bg-panel border border-border flex items-center justify-center hover:border-neonPrimary/50 transition-colors relative">
              <span className="font-mono text-xs font-bold text-primary">OI</span>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-bg rounded-full"></span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="h-16 flex items-center justify-between px-8 shrink-0 animate-fade-in relative z-40 bg-bg/50 backdrop-blur-md border-b border-border/10">
            <div>
              <h1 className="font-display text-xl font-medium text-primary tracking-tight">
                {location.pathname === '/' ? '仪表盘' : location.pathname === '/providers' ? '供应商' : location.pathname === '/logs' ? '实时日志' : '设置'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-secondary/60 font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                实时监控中
              </div>
            </div>
            <div className="flex items-center gap-4">
              
              {/* Provider Selector */}
              <div className="relative" ref={providerMenuRef}>
                <button 
                  onClick={() => setIsProviderMenuOpen(!isProviderMenuOpen)}
                  className="flex items-center gap-3 px-4 py-2 rounded-full bg-panel border border-border hover:border-white/20 transition-all group"
                >
                  <div className={cn("w-2 h-2 rounded-full", activeProvider ? "bg-neonPrimary" : "bg-secondary")}></div>
                  <span className="text-xs font-medium text-primary group-hover:text-neonPrimary transition-colors max-w-[120px] truncate">
                    {activeProvider ? (activeProvider.display_name || activeProvider.api_key_prefix + '...') : '无活跃 Key'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-secondary" />
                </button>

                {/* Provider Dropdown */}
                {isProviderMenuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-panel border border-border/80 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col py-1 animate-fade-in backdrop-blur-xl ring-1 ring-white/10">
                    <div className="px-3 py-2 text-[10px] text-secondary font-mono uppercase tracking-wider">
                      Switch Context
                    </div>
                    {providers.map(p => (
                      <button
                        key={p.id}
                        className="px-3 py-2 text-xs text-left text-primary hover:bg-white/5 flex items-center justify-between transition-colors group"
                        onClick={() => {
                          // TODO: Implement context switching logic if needed
                          // For now just close menu as CLI controls active status
                          setIsProviderMenuOpen(false);
                        }}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium">{p.display_name || '未命名'}</span>
                          <span className="text-[10px] text-secondary font-mono truncate">{p.api_key_prefix}...</span>
                        </div>
                        {p.id === activeProviderId && <Check className="w-3 h-3 text-neonPrimary" />}
                      </button>
                    ))}
                    {providers.length === 0 && (
                      <div className="px-3 py-2 text-xs text-secondary text-center">暂无供应商</div>
                    )}
                    <div className="h-px bg-white/5 my-1"></div>
                    <Link 
                      to="/providers"
                      onClick={() => setIsProviderMenuOpen(false)}
                      className="px-3 py-2 text-xs text-center text-neonPrimary hover:text-white transition-colors"
                    >
                      管理所有 Key
                    </Link>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-white/5 transition-colors relative group"
                title={`当前主题: ${theme}`}
              >
                {theme === 'dark' && <Moon className="w-4 h-4 text-secondary group-hover:text-white" />}
                {theme === 'light' && <Sun className="w-4 h-4 text-secondary group-hover:text-white" />}
                {theme === 'system' && <span className="text-[10px] font-bold text-secondary group-hover:text-white">A</span>}
              </button>
            </div>
          </header>

          <div className="flex-1 px-8 pb-8 min-h-0">
            <div className="w-full h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
