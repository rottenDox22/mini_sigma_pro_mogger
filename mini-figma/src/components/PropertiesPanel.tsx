import type { Shape as ShapeModel } from '../types/shape';

interface PropertiesPanelProps {
  selectedShapes: ShapeModel[];
  onUpdateShape: (id: string, patch: Partial<Omit<ShapeModel, 'id'>>) => void;
}

/**
 * src/components/PropertiesPanel.tsx
 * Панель свойств справа сверху. Показывает сводку по выделению и позволяет
 * менять цвет заливки/обводки выбранной фигуры.
 * TODO (шаг 5): поля X, Y, W, H, поворот — редактором значений.
 */
export function PropertiesPanel({ selectedShapes, onUpdateShape }: PropertiesPanelProps) {
  const first = selectedShapes[0];

  return (
    <aside className="absolute right-3 top-3 z-10 w-60 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Свойства
      </h2>

      {!first ? (
        <p className="mt-3 text-sm text-slate-400">
          Ничего не выбрано — нарисуйте фигуру или выберите её в слоях
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-slate-400">Тип</dt>
              <dd className="font-medium capitalize text-slate-700">{first.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Размер</dt>
              <dd className="font-medium text-slate-700">
                {Math.round(first.width)} × {Math.round(first.height)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Позиция</dt>
              <dd className="font-medium text-slate-700">
                ({Math.round(first.x)}; {Math.round(first.y)})
              </dd>
            </div>
          </dl>

          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Заливка</span>
            <span className="flex items-center gap-2">
              <input
                type="color"
                value={first.fill}
                onChange={(e) => onUpdateShape(first.id, { fill: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5"
                aria-label="Цвет заливки"
              />
              <span className="font-mono text-xs text-slate-500">{first.fill}</span>
            </span>
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Обводка</span>
            <span className="flex items-center gap-2">
              <input
                type="color"
                value={first.stroke}
                onChange={(e) => onUpdateShape(first.id, { stroke: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5"
                aria-label="Цвет обводки"
              />
              <span className="font-mono text-xs text-slate-500">{first.stroke}</span>
            </span>
          </label>
        </div>
      )}
    </aside>
  );
}