import { useState } from 'react';
import type { Tool } from './types/shape';
import { useShapes } from './hooks/useShapes';
import { useHotkeys } from './hooks/useHotkeys';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel';

/**
 * src/App.tsx
 * Собирает холст и три панели. Владеет инструментом и данными фигур,
 * компоненты при этом остаются тонкими.
 */
export default function App() {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const {
    shapes,
    selectedIds,
    draft,
    startDraft,
    updateDraft,
    commitDraft,
    updateShape,
    moveSelectedShapes,
    selectShapes,
    undo,
    redo,
    endGesture,
  } = useShapes();

  // Горячие клавиши: V/R/O — инструменты, Ctrl+Z / Ctrl+Shift+Z — отмена/повтор.
  useHotkeys({ onSelectTool: setActiveTool, onUndo: undo, onRedo: redo });

  const selectedShapes = shapes.filter((shape) => selectedIds.includes(shape.id));

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100 text-slate-900">
      <Canvas
        tool={activeTool}
        shapes={shapes}
        draft={draft}
        selectedIds={selectedIds}
        onStartShape={startDraft}
        onUpdateDraft={updateDraft}
        onCommitDraft={commitDraft}
        onSelectShapes={selectShapes}
        onMoveSelectedShapes={moveSelectedShapes}
        onEndGesture={endGesture}
      />
      <Toolbar activeTool={activeTool} onSelectTool={setActiveTool} />
      <PropertiesPanel selectedShapes={selectedShapes} onUpdateShape={updateShape} />
      <LayersPanel shapes={shapes} selectedIds={selectedIds} onSelectShapes={selectShapes} />
    </div>
  );
}