import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Shape as ShapeModel, ShapeType, Tool } from '../types/shape';
import { useViewport } from '../hooks/useViewport';
import { screenToCanvas, topShapeAt } from '../utils/geometry';
import { Shape } from './Shape';

/** Размер ячейки сетки в единицах канваса. */
const GRID_BASE = 20;

interface CanvasProps {
  tool: Tool;
  shapes: ShapeModel[];
  /** Фигура прямо сейчас растягивается мышью — рендерится поверх списка. */
  draft: ShapeModel | null;
  selectedIds: string[];
  onStartShape: (type: ShapeType, x: number, y: number) => void;
  onUpdateDraft: (x: number, y: number) => void;
  onCommitDraft: () => void;
  onSelectShapes: (ids: string[]) => void;
  onMoveSelectedShapes: (dx: number, dy: number) => void;
  /** Конец активного жеста — история открывается для записи следующего шага. */
  onEndGesture: () => void;
}

/**
 * src/components/Canvas.tsx
 * Холст на весь экран: сетка на фоне, обрабатывает мышь. Вся математика
 * камеры — в useViewport, состояние фигур — в useShapes; компонент только
 * связывает события с их методами и пересчитывает координаты через geometry.
 */
export function Canvas({
  tool,
  shapes,
  draft,
  selectedIds,
  onStartShape,
  onUpdateDraft,
  onCommitDraft,
  onSelectShapes,
  onMoveSelectedShapes,
  onEndGesture,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewport, isSpaceDown, beginPan, updatePan, endPan } = useViewport(containerRef);

  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMovingShape, setIsMovingShape] = useState(false);
  // Позиция мыши в экранных координатах относительно контейнера (для HUD).
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  // Опорная точка перетаскивания фигуры в координатах канваса.
  const moveLastPoint = useRef<{ x: number; y: number } | null>(null);

  // Отпустили пробел во время панорамирования — выходим из режима.
  useEffect(() => {
    if (!isSpaceDown) setIsPanning(false);
  }, [isSpaceDown]);

  const positionFromEvent = (e: ReactMouseEvent): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
  };

  const onMouseDown = (e: ReactMouseEvent) => {
    if (e.button !== 0) return; // только левая кнопка

    const position = positionFromEvent(e);

    // Панорамирование (пробел + мышь) имеет приоритет над всем остальным.
    if (isSpaceDown) {
      setIsPanning(true);
      beginPan(position.x, position.y);
      return;
    }

    const canvasPoint = screenToCanvas(position, viewport);

    // Инструмент «выделение»: клик по фигуре выделяет её и начинает
    // перетаскивание; клик по пустому месту — снимает выделение.
    if (tool === 'select') {
      const hit = topShapeAt(canvasPoint, shapes);
      if (hit) {
        onSelectShapes([hit.id]);
        setIsMovingShape(true);
        moveLastPoint.current = canvasPoint;
      } else {
        onSelectShapes([]);
      }
      return;
    }

    // Инструменты «прямоугольник» и «эллипс» рисуют перетаскиванием.
    // Экранные координаты мыши переводим в координаты канваса — иначе фигура
    // «уезжала» бы от курсора при зуме и сдвиге холста.
    setIsDrawing(true);
    onStartShape(tool, canvasPoint.x, canvasPoint.y);
  };

  const onMouseMove = (e: ReactMouseEvent) => {
    const position = positionFromEvent(e);
    setCursor(position);

    if (isPanning) {
      updatePan(position.x, position.y);
      return;
    }

    const canvasPoint = screenToCanvas(position, viewport);

    // Перетаскивание выделенной фигуры: дельту считаем в координатах канваса,
    // поэтому фигура едет ровно за курсором при любом зуме.
    if (isMovingShape && moveLastPoint.current) {
      const dx = canvasPoint.x - moveLastPoint.current.x;
      const dy = canvasPoint.y - moveLastPoint.current.y;
      moveLastPoint.current = canvasPoint;
      onMoveSelectedShapes(dx, dy);
      return;
    }

    if (isDrawing) {
      onUpdateDraft(canvasPoint.x, canvasPoint.y);
    }
  };

  /** mouseup или уход мыши с холста: фиксируем фигуру, перемещение и/или панорамирование. */
  const finishInteraction = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onCommitDraft();
    }
    if (isPanning) {
      setIsPanning(false);
      endPan();
    }
    if (isMovingShape) {
      setIsMovingShape(false);
      moveLastPoint.current = null;
    }
    // Жест закончен — следующий drag запишется в историю отдельным шагом.
    onEndGesture();
  };

  // Адаптивная сетка: при сильном отдалении увеличиваем шаг,
  // чтобы линии не слипались в сплошную заливку.
  let gridSize = GRID_BASE;
  while (gridSize * viewport.zoom < 20) gridSize *= 5;

  const worldTransform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
  const gridBackground =
    'linear-gradient(to right, rgba(100, 116, 139, 0.28) 1px, transparent 1px), ' +
    'linear-gradient(to bottom, rgba(100, 116, 139, 0.28) 1px, transparent 1px)';

  // Курсор мыши, пересчитанный в координаты канваса (живое применение geometry).
  const canvasPoint = screenToCanvas(cursor, viewport);

  const cursorClass = isPanning
    ? 'cursor-grabbing'
    : isMovingShape
      ? 'cursor-grabbing'
      : isSpaceDown
        ? 'cursor-grab'
        : tool !== 'select'
          ? 'cursor-crosshair'
          : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 select-none overflow-hidden ${cursorClass}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={finishInteraction}
      onMouseLeave={finishInteraction}
    >
      {/* Сетка на фоне — лежит в координатах канваса и движется вместе с камерой */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: worldTransform,
          transformOrigin: '0 0',
          backgroundImage: gridBackground,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />

      {/* Фигуры — в тех же мировых координатах, что и сетка: фигуры масштабируются
          вместе с канвасом автоматически */}
      <div
        className="absolute inset-0"
        style={{ transform: worldTransform, transformOrigin: '0 0' }}
      >
        {shapes.map((shape) => (
          <Shape key={shape.id} shape={shape} selected={selectedIds.includes(shape.id)} />
        ))}
        {/* Черновик рисуется поверх готовых фигур, пока мышь не отпущена */}
        {draft && <Shape shape={draft} selected={false} />}
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-slate-900/70 px-3 py-1.5 font-mono text-xs text-slate-200">
        канвас: {canvasPoint.x.toFixed(0)} · {canvasPoint.y.toFixed(0)} — зум{' '}
        {Math.round(viewport.zoom * 100)}%
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300">
        {tool === 'select'
          ? 'Клик — выделить · Тянуть — перенести · Пробел + мышь — панорамирование · Колесо — зум'
          : `Рисуйте «${tool === 'rectangle' ? 'прямоугольник' : 'эллипс'}» перетаскиванием · Пробел — панорамирование`}
      </div>
    </div>
  );
}