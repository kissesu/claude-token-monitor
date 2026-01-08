import { useState } from 'react';
import { Moon, Sun, Monitor, Power, Bell, FolderOpen, Database, RefreshCw, Github, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [autoStart, setAutoStart] = useState(false);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="h-full flex flex-col gap-8 overflow-y-auto no-scrollbar w-full pb-8">
      
      {/* 头部说明 (移除重复的大标题，保留描述) */}
      <div className="shrink-0 animate-slide-up delay-100 mt-2">
        <p className="text-sm text-secondary">管理应用外观、系统集成偏好及数据存储选项。</p>
      </div>

      {/* Appearance */}
      <section className="bento-card p-6 animate-slide-up delay-200 shrink-0">
        <h3 className="text-sm font-medium text-primary mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-neonPrimary" /> 外观
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', icon: Sun, label: '浅色模式' },
            { id: 'dark', icon: Moon, label: '深色模式' },
            { id: 'system', icon: Monitor, label: '跟随系统' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTheme(item.id as any)}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-lg border transition-all",
                theme === item.id 
                  ? "bg-neonPrimary/10 border-neonPrimary/50 text-neonPrimary" 
                  : "bg-white/5 border-transparent hover:bg-white/10 text-secondary"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* System Integration */}
      <section className="bento-card p-0 overflow-hidden animate-slide-up delay-300 shrink-0">
        <div className="p-6 border-b border-white/5">
           <h3 className="text-sm font-medium text-primary flex items-center gap-2">
            <Power className="w-4 h-4 text-neonBlue" /> 系统集成
          </h3>
        </div>
        <div className="divide-y divide-white/5">
           <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div>
                <div className="text-sm text-primary font-medium">开机自启动</div>
                <div className="text-xs text-secondary mt-1">系统启动时自动运行 Claude Monitor</div>
              </div>
              <button 
                onClick={() => setAutoStart(!autoStart)}
                className={cn(
                  "w-11 h-6 rounded-full relative transition-colors duration-300",
                  autoStart ? "bg-neonPrimary" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300",
                  autoStart ? "left-6" : "left-1"
                )}></div>
              </button>
           </div>
           
           <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div>
                <div className="text-sm text-primary font-medium">最小化到托盘</div>
                <div className="text-xs text-secondary mt-1">关闭窗口时最小化到系统托盘而非退出</div>
              </div>
              <button 
                onClick={() => setMinimizeToTray(!minimizeToTray)}
                className={cn(
                  "w-11 h-6 rounded-full relative transition-colors duration-300",
                  minimizeToTray ? "bg-neonPrimary" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300",
                  minimizeToTray ? "left-6" : "left-1"
                )}></div>
              </button>
           </div>

           <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div>
                <div className="text-sm text-primary font-medium flex items-center gap-2">
                  <Bell className="w-3 h-3 text-secondary" /> 系统通知
                </div>
                <div className="text-xs text-secondary mt-1">当检测到供应商切换时发送桌面通知</div>
              </div>
               <button 
                onClick={() => setNotifications(!notifications)}
                className={cn(
                  "w-11 h-6 rounded-full relative transition-colors duration-300",
                  notifications ? "bg-neonPrimary" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300",
                  notifications ? "left-6" : "left-1"
                )}></div>
              </button>
           </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="bento-card p-6 animate-slide-up delay-400 shrink-0">
        <h3 className="text-sm font-medium text-primary mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-neonGreen" /> 数据管理
        </h3>
        
        <div className="flex flex-col gap-4">
           <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4 h-4 text-secondary" />
                 </div>
                 <div className="min-w-0">
                    <div className="text-xs text-secondary mb-0.5">数据存储位置</div>
                    <div className="text-xs font-mono text-primary truncate">~/Library/Application Support/com.claude-token-monitor/</div>
                 </div>
              </div>
              <button className="px-3 py-1.5 rounded text-xs font-medium bg-white/5 hover:bg-white/10 text-white transition-colors shrink-0">
                 打开
              </button>
           </div>

           <div className="flex justify-end">
              <button className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-2">
                 <RefreshCw className="w-3 h-3" /> 清除所有统计数据
              </button>
           </div>
        </div>
      </section>

      {/* About */}
      <section className="text-center py-8 animate-slide-up delay-500 shrink-0">
         <div className="flex items-center justify-center gap-4 mb-4">
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-secondary transition-all">
               <Github className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-secondary transition-all">
               <ExternalLink className="w-4 h-4" />
            </a>
         </div>
         <p className="text-xs text-secondary font-mono">Claude Token Monitor v1.0.0</p>
         <p className="text-[10px] text-secondary/50 mt-1">Built with Tauri 2.0 & React 19</p>
      </section>

    </div>
  );
}