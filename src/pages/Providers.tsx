/**
 * @file Providers.tsx
 * @description 供应商管理页面，展示各 API Key 的使用情况、费用统计和管理功能
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { useEffect, useState } from 'react';
import { Check, MoreHorizontal, Key, Calendar, DollarSign, Zap, Database, Edit2, Save, X, Plus, Trash2, Copy, Info } from 'lucide-react';
import { cn, formatCompactNumber } from '../lib/utils';
import { useAppStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ErrorMessage } from '../components/common/Feedback';
import { Dialog, ConfirmDialog, AlertDialog } from '../components/common/Dialog';

export function Providers() {
  const { providerStats, activeProviderId, updateProviderName, addProvider, deleteProvider, error, setError } = useAppStore();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  
  // Adding state
  const [isAdding, setIsAdding] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menu state
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  // Dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; providerId: number | null }>({ open: false, providerId: null });
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });
  const [copySuccess, setCopySuccess] = useState(false);
  const [detailProviderId, setDetailProviderId] = useState<number | null>(null);

  useEffect(() => {
    if (menuOpenId === null) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        setMenuOpenId(null);
        return;
      }

      if (target.closest('[data-provider-menu]') || target.closest('[data-provider-menu-toggle]')) {
        return;
      }

      setMenuOpenId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId]);

  // 找到当前活跃的 Provider Stats
  const activeStats = providerStats.find(p => p.provider.id === activeProviderId);

  const handleEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setMenuOpenId(null);
  };

  const handleSave = async (id: number) => {
    if (editName.trim()) {
      setError(null);
      try {
        await updateProviderName(id, editName.trim());
        setEditingId(null);
      } catch (e) {
        // 保持编辑模式打开，让用户可以重试
        setError(e instanceof Error ? e.message : '更新名称失败');
      }
    } else {
      setEditingId(null);
    }
  };

  const handleAddProvider = async () => {
    if (!newApiKey.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await addProvider(newApiKey.trim(), newProviderName.trim() || undefined);
      setIsAdding(false);
      setNewApiKey('');
      setNewProviderName('');
    } catch (e) {
      setAlertState({
        open: true,
        title: '添加失败',
        message: (e as Error).message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteConfirm({ open: true, providerId: id });
    setMenuOpenId(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.providerId === null) return;
    setError(null);
    await deleteProvider(deleteConfirm.providerId);
    setDeleteConfirm({ open: false, providerId: null });
  };

  const handleCopy = (text: string) => {
    setError(null);
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      setError(err instanceof Error ? err.message : '复制失败');
    });
    setMenuOpenId(null);
  };

  return (
    <div className="h-full flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar relative">
      {error && <ErrorMessage message={error} />}

      {/* 复制成功提示 */}
      {copySuccess && (
        <div className="fixed top-20 right-8 z-50 px-4 py-2 bg-emerald-500/90 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          已复制到剪切板
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex items-center justify-between shrink-0 animate-slide-up delay-100">
        <div>
          <h2 className="font-display text-lg font-medium text-primary">供应商管理</h2>
          <p className="text-xs text-secondary mt-1">查看各 API Key 的使用情况与费用统计</p>
        </div>
      </div>

      {/* Active Provider Banner */}
      {activeStats && (
        <div className="bento-card p-6 flex items-center justify-between bg-gradient-to-r from-panel to-neonPrimary/5 border-neonPrimary/20 animate-slide-up delay-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neonPrimary/20 flex items-center justify-center border border-neonPrimary/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Check className="w-6 h-6 text-neonPrimary" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-neonPrimary mb-1">当前活跃 (Active)</div>
              <div className="text-xl font-display font-medium text-primary">
                {activeStats.provider.display_name || '未命名供应商'}
              </div>
              <div className="text-xs text-secondary font-mono mt-0.5">
                {activeStats.provider.api_key_prefix}...{activeStats.provider.api_key_hash.slice(-4)}
              </div>
            </div>
          </div>
          <div className="flex gap-8 text-right">
            <div>
               <div className="text-[10px] text-secondary uppercase mb-1">今日消耗</div>
               <div className="text-lg font-mono text-primary">¥{(activeStats.today_cost_usd * 7.2).toFixed(2)}</div>
            </div>
            <div>
               <div className="text-[10px] text-secondary uppercase mb-1">Token</div>
               <div className="text-lg font-mono text-primary">
                 {formatCompactNumber(activeStats.today_input_tokens + activeStats.today_output_tokens)}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up delay-300 pb-6">
        {providerStats.map((stat) => {
          const isEditing = editingId === stat.provider.id;
          const isActive = stat.provider.id === activeProviderId;
          const isMenuOpen = menuOpenId === stat.provider.id;

          return (
            <div 
              key={stat.provider.id}
              className={cn(
                "bento-card p-6 flex flex-col gap-4 group transition-all duration-300 relative", // relative for z-index context if needed
                isActive ? "ring-1 ring-neonPrimary/50 bg-neonPrimary/5" : "hover:bg-white/5",
                isMenuOpen ? "z-20" : "z-0" // 确保打开菜单的卡片层级高于遮罩？不，菜单本身应该是 z-20，遮罩 z-10
              )}
            >
              <div className="flex justify-between items-start h-10 relative">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "w-8 h-8 rounded flex items-center justify-center border shrink-0",
                    isActive 
                      ? "bg-neonPrimary/10 border-neonPrimary/20 text-neonPrimary" 
                      : "bg-white/5 border-white/10 text-secondary"
                  )}>
                    <Key className="w-4 h-4" />
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-black/50 border border-neonPrimary/50 rounded px-2 py-1 text-sm text-white focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(stat.provider.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button onClick={() => handleSave(stat.provider.id)} className="text-neonPrimary hover:text-white">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1 group/title">
                      <div className="flex items-center gap-2">
                        <div className={cn("text-sm font-medium truncate", isActive ? "text-primary" : "text-secondary group-hover:text-primary transition-colors")}>
                          {stat.provider.display_name || '未命名'}
                        </div>
                        <button 
                          onClick={() => handleEdit(stat.provider.id, stat.provider.display_name || '')}
                          className="opacity-0 group-hover/title:opacity-100 text-secondary hover:text-neonPrimary transition-opacity"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-secondary/60 truncate">
                        {stat.provider.api_key_prefix}...
                      </div>
                    </div>
                  )}
                </div>
                
                {!isEditing && (
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : stat.provider.id);
                      }}
                      data-provider-menu-toggle
                      className={cn(
                        "text-secondary hover:text-white transition-colors p-1 rounded hover:bg-white/10",
                        isMenuOpen ? "text-white bg-white/10" : ""
                      )}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu - z-index 20 to sit above overlay (z-10) */}
                    {isMenuOpen && (
                      <div
                        data-provider-menu
                        className="absolute right-0 top-8 w-32 bg-panel border border-border/80 rounded-lg shadow-xl z-20 overflow-hidden flex flex-col py-1 animate-fade-in backdrop-blur-xl ring-1 ring-white/10"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(stat.provider.api_key_prefix);
                          }}
                          className="px-3 py-2 text-xs text-left text-secondary hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                        >
                          <Copy className="w-3 h-3" /> 复制前缀
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailProviderId(stat.provider.id);
                            setMenuOpenId(null);
                          }}
                          className="px-3 py-2 text-xs text-left text-secondary hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                        >
                          <Info className="w-3 h-3" /> 详细信息
                        </button>
                        <div className="h-px bg-white/10 my-1 mx-2"></div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRequest(stat.provider.id);
                          }}
                          className="px-3 py-2 text-xs text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> 删除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-white/5 w-full"></div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-secondary flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" /> 今日费用
                  </span>
                  <span className="font-mono text-sm text-primary">¥{(stat.today_cost_usd * 7.2).toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-secondary flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> 今日 Token
                  </span>
                  <span className="font-mono text-sm text-primary">
                    {formatCompactNumber(stat.today_input_tokens + stat.today_output_tokens)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-secondary flex items-center gap-1.5">
                    <Database className="w-3 h-3" /> 缓存节省
                  </span>
                  <span className="font-mono text-sm text-emerald-400">
                    {(stat.cache_hit_rate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-auto">
                  <span className="text-[10px] text-secondary flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> 上次活跃
                  </span>
                  <span className="font-mono text-[10px] text-secondary/70">
                    {tryFormatDate(stat.provider.last_seen_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add New / Auto-Discover Card */}
        {isAdding ? (
          <div className="bento-card p-6 flex flex-col gap-4 ring-1 ring-neonPrimary/50 bg-neonPrimary/5">
            <div className="flex items-center gap-2 text-sm font-medium text-neonPrimary">
              <Plus className="w-4 h-4" /> 添加新 Key
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-secondary uppercase font-mono mb-1 block">API Key (sk-ant...)</label>
                <input 
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-white/50 dark:bg-black/50 border border-border/50 rounded px-3 py-2 text-sm text-primary focus:border-neonPrimary/50 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary uppercase font-mono mb-1 block">显示名称 (可选)</label>
                <input 
                  type="text"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="e.g. 个人测试"
                  className="w-full bg-white/50 dark:bg-black/50 border border-border/50 rounded px-3 py-2 text-sm text-primary focus:border-neonPrimary/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <button 
                onClick={handleAddProvider}
                disabled={!newApiKey || isSubmitting}
                className="flex-1 bg-neonPrimary text-white text-xs font-medium py-2 rounded hover:bg-neonPrimary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '添加中...' : '确定添加'}
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 border border-white/10 rounded text-xs font-medium text-secondary hover:text-white hover:bg-white/5 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsAdding(true)}
            className="bento-card border-dashed border-white/10 flex flex-col items-center justify-center gap-3 min-h-[200px] hover:border-neonPrimary/30 hover:bg-neonPrimary/5 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Plus className="w-5 h-5 text-secondary group-hover:text-neonPrimary transition-colors" />
            </div>
            <div className="text-center px-4">
              <div className="text-xs font-medium text-secondary group-hover:text-neonPrimary transition-colors mb-1">手动添加 Key</div>
              <div className="text-[10px] text-secondary/60">或者在 CLI 中使用以自动发现</div>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, providerId: null })}
        title="删除供应商"
        message="确定要删除此供应商及其所有统计数据吗？此操作不可恢复。"
        confirmText="确定删除"
        variant="danger"
      />

      {/* 错误提示对话框 */}
      <AlertDialog
        open={alertState.open}
        onClose={() => setAlertState({ open: false, title: '', message: '' })}
        title={alertState.title}
        message={alertState.message}
        variant="error"
      />

      {/* 供应商详情对话框 */}
      <ProviderDetailDialog
        providerId={detailProviderId}
        providerStats={providerStats}
        onClose={() => setDetailProviderId(null)}
      />
    </div>
  );
}

function tryFormatDate(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: zhCN });
  } catch (e) {
    return '未知';
  }
}

/**
 * 供应商详情对话框组件
 */
interface ProviderDetailDialogProps {
  providerId: number | null;
  providerStats: import('../types/tauri').ProviderStats[];
  onClose: () => void;
}

function ProviderDetailDialog({ providerId, providerStats, onClose }: ProviderDetailDialogProps) {
  if (providerId === null) return null;

  const stat = providerStats.find(p => p.provider.id === providerId);
  if (!stat) return null;

  const { provider } = stat;

  return (
    <Dialog open={true} onClose={onClose}>
      <div className="p-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neonPrimary/10 flex items-center justify-center border border-neonPrimary/20">
              <Key className="w-5 h-5 text-neonPrimary" />
            </div>
            <div>
              <h3 className="text-base font-medium text-primary">
                {provider.display_name || '未命名供应商'}
              </h3>
              <p className="text-xs text-secondary font-mono">
                {provider.api_key_prefix}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 详情信息 */}
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase text-secondary mb-3">基本信息</h4>
            <DetailRow label="ID" value={String(provider.id)} />
            <DetailRow label="API Key 前缀" value={provider.api_key_prefix} mono />
            <DetailRow label="API Key 哈希" value={provider.api_key_hash.slice(0, 16) + '...'} mono />
            <DetailRow label="状态" value={provider.is_active ? '活跃' : '非活跃'} highlight={provider.is_active} />
            {provider.base_url && (
              <DetailRow label="Base URL" value={provider.base_url} mono />
            )}
          </div>

          {/* 时间信息 */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase text-secondary mb-3">时间信息</h4>
            <DetailRow label="首次发现" value={tryFormatDate(provider.first_seen_at)} />
            <DetailRow label="最后活跃" value={tryFormatDate(provider.last_seen_at)} />
          </div>

          {/* 今日统计 */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase text-secondary mb-3">今日统计</h4>
            <DetailRow label="输入 Token" value={formatCompactNumber(stat.today_input_tokens)} />
            <DetailRow label="输出 Token" value={formatCompactNumber(stat.today_output_tokens)} />
            <DetailRow label="缓存读取" value={formatCompactNumber(stat.today_cache_read_tokens)} />
            <DetailRow label="缓存创建" value={formatCompactNumber(stat.today_cache_creation_tokens)} />
            <DetailRow label="费用 (USD)" value={`$${stat.today_cost_usd.toFixed(4)}`} />
            <DetailRow label="费用 (CNY)" value={`¥${(stat.today_cost_usd * 7.2).toFixed(2)}`} />
            <DetailRow label="缓存命中率" value={`${(stat.cache_hit_rate * 100).toFixed(1)}%`} highlight />
          </div>
        </div>

        {/* 关闭按钮 */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-neonPrimary hover:bg-neonPrimary/90 text-white rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * 详情行组件
 */
interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}

function DetailRow({ label, value, mono, highlight }: DetailRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-secondary">{label}</span>
      <span className={cn(
        "text-xs",
        mono ? "font-mono" : "",
        highlight ? "text-emerald-400" : "text-primary"
      )}>
        {value}
      </span>
    </div>
  );
}
