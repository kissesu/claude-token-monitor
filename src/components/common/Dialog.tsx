/**
 * @file Dialog.tsx
 * @description 对话框组件库，包含确认对话框和提示对话框，替代原生 confirm/alert
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { ReactNode } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 基础对话框容器
 */
export function Dialog({ open, onClose, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* 对话框内容 */}
      <div className="relative bg-panel border border-border/80 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in ring-1 ring-white/10">
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * 确认对话框，替代原生 confirm()
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showConfirm}
 *   onConfirm={() => { handleDelete(); setShowConfirm(false); }}
 *   onCancel={() => setShowConfirm(false)}
 *   title="删除确认"
 *   message="确定要删除此项吗？此操作不可恢复。"
 *   variant="danger"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'warning'
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      iconClass: 'text-red-400 bg-red-500/10 border-red-500/20',
      buttonClass: 'bg-red-500 hover:bg-red-600 text-white'
    },
    warning: {
      icon: AlertTriangle,
      iconClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    info: {
      icon: Info,
      iconClass: 'text-neonPrimary bg-neonPrimary/10 border-neonPrimary/20',
      buttonClass: 'bg-neonPrimary hover:bg-neonPrimary/90 text-white'
    }
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <Dialog open={open} onClose={onCancel}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border shrink-0", styles.iconClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-primary mb-2">{title}</h3>
            <p className="text-sm text-secondary">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-secondary hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary border border-border/50 rounded-lg hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", styles.buttonClass)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'error' | 'success' | 'info';
}

/**
 * 提示对话框，替代原生 alert()
 *
 * @example
 * ```tsx
 * <AlertDialog
 *   open={showAlert}
 *   onClose={() => setShowAlert(false)}
 *   title="操作失败"
 *   message="添加失败: 无效的 API Key"
 *   variant="error"
 * />
 * ```
 */
export function AlertDialog({
  open,
  onClose,
  title,
  message,
  buttonText = '确定',
  variant = 'info'
}: AlertDialogProps) {
  const variantStyles = {
    error: {
      icon: AlertTriangle,
      iconClass: 'text-red-400 bg-red-500/10 border-red-500/20',
      buttonClass: 'bg-red-500 hover:bg-red-600 text-white'
    },
    success: {
      icon: Info,
      iconClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white'
    },
    info: {
      icon: Info,
      iconClass: 'text-neonPrimary bg-neonPrimary/10 border-neonPrimary/20',
      buttonClass: 'bg-neonPrimary hover:bg-neonPrimary/90 text-white'
    }
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border shrink-0", styles.iconClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-primary mb-2">{title}</h3>
            <p className="text-sm text-secondary">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", styles.buttonClass)}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
