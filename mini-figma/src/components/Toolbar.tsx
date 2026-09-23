import type { Tool } from '../types/shape';
import { TOOLS } from '../constants/tools';

interface ToolbarProps {
  activeTool: Tool;
  onSelectTool: (tool: Tool) => void;
}

/**
 * src/components/Toolbar.tsx
 * Панель инструментов слева. Пока каркас: инструменты берутся из
 * constants/tools (одна точка правды для списка и клавиш), клик — выбор.
 */
export function Toolbar({ activeTool, onSelectTool }: ToolbarProps) {
  return (
    <aside className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-slate-200 bg-white/90 p-1.5 shadow-lg backdrop-blur">
      {TOOLS.map((tool) => {
        const isActive = tool.id === activeTool;
        return (
          <button
            key={tool.id}
            type="button"
            title={`${tool.label} (${tool.key.toUpperCase()})`}
            aria-pressed={isActive}
            onClick={() => onSelectTool(tool.id)}
            className={[
              'grid h-9 w-9 place-items-center rounded-lg text-lg transition-colors',
              isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100',
            ].join(' ')}
          >
            {tool.icon}
          </button>
        );
      })}
    </aside>
  );
}