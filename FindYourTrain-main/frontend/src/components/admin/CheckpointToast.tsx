import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, MapPin, X } from 'lucide-react';
import type { Checkpoint } from '../../types';

interface ToastEntry {
  id: string;
  checkpoint: Checkpoint;
  at: number;
}

interface CheckpointToastProps {
  checkpoints: Checkpoint[];
}

/**
 * Admin-only checkpoint crossing toast notification.
 * Watches for checkpoints transitioning from isCrossed=false → isCrossed=true
 * and pops a styled notification. Meant to be rendered inside a relative-positioned container.
 */
export function CheckpointToast({ checkpoints }: CheckpointToastProps) {
  const prevRef = useRef<Map<string, boolean>>(new Map());
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => {
    const newToasts: ToastEntry[] = [];
    checkpoints.forEach(cp => {
      const wasCrossed = prevRef.current.get(cp.id) ?? false;
      if (!wasCrossed && cp.isCrossed) {
        newToasts.push({ id: `${cp.id}-${Date.now()}`, checkpoint: cp, at: Date.now() });
      }
      prevRef.current.set(cp.id, cp.isCrossed);
    });

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts].slice(-5));
    }
  }, [checkpoints]);

  // Auto-dismiss after 5 s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(t => now - t.at < 5000));
    }, 5100);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismiss = (id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div
      className="pointer-events-none absolute top-3 right-3 z-50 flex flex-col gap-2"
      style={{ maxWidth: 280 }}
    >
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-start gap-3 bg-emerald-600 text-white rounded-xl shadow-2xl px-3.5 py-3 border border-emerald-500"
          >
            <div className="mt-0.5 shrink-0">
              <CheckCircle2 size={18} className="text-emerald-200" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-0.5">
                Checkpoint Crossed
              </p>
              <p className="text-sm font-black font-mono truncate">{t.checkpoint.label}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-emerald-300 shrink-0" />
                <p className="text-xs text-emerald-200">{t.checkpoint.distanceKm} km from origin</p>
              </div>
            </div>

            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-emerald-300 hover:text-white transition-colors mt-0.5"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
