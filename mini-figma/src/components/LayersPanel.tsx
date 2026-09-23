import type { Shape as ShapeModel } from '../types/shape';

interface LayersPanelProps {
  shapes: ShapeModel[];
  selectedIds: string[];
  onSelectShapes: (ids: string[]) => void;
}

/**
 * src/components/LayersPanel.tsx
 * Панель слоёв справа снизу. Пока каркас: список фигур с выделением.
 * TODO (шаг 4): переупорядочивание, группировка, видимость слоёв.
 */
export function LayersPanel({ shapes, selectedIds, onSelectShapes }: LayersPanelProps) {
  return (
    <aside className="absolute bottom-3 right-3 z-10 w-60 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Слои</h2>

      {shapes.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Слоёв пока нет</p>
      ) : (
        <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
          {shapes.map((shape, index) => {
            const isSelected = selectedIds.includes(shape.id);
            return (
              <li key={shape.id}>
                <button
                  type="button"
                  onClick={() => onSelectShapes([shape.id])}
                  className={[
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <span aria-hidden="true">{shape.type === 'rectangle' ? '▭' : '◯'}</span>
                  <span className="capitalize">{shape.type}</span>
                  <span className="ml-auto text-xs text-slate-400">№{index + 1}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}