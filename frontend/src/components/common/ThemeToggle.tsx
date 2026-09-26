import { useThemeStore } from '../../store/themeStore';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      className={`relative flex items-center gap-2 rounded-full border transition-all duration-300 ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ rotate: isDark ? 0 : 180, scale: [1, 0.8, 1] }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Moon size={size === 'sm' ? 14 : 16} className="text-brand-400" /> : <Sun size={size === 'sm' ? 14 : 16} className="text-amber-500" />}
      </motion.div>
      <span className="font-medium">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
