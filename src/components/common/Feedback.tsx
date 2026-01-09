/**
 * @file Feedback.tsx
 * @description 反馈组件库，包含加载指示器和错误消息展示组件
 * @author Atlas.oi
 * @date 2026-01-10
 */

import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <Loader2 className="w-6 h-6 text-neonPrimary animate-spin" />
    </div>
  );
}

export function ErrorMessage({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm", className)}>
      {message}
    </div>
  );
}
