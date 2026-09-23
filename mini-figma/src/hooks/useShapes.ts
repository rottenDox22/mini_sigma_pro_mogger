import { useCallback, useRef, useState } from 'react';
import type { Shape, ShapeType } from '../types/shape';

let idCounter = 0;
const createId = (): string => `shape-${Date.now()}-${idCounter++}`;

export const DEFAULT_FILL = '#0ea5e9';
export const DEFAULT_STROKE = '#0f172a';

/** Максимум шагов истории отмены — самые старые отбрасываются. */
const MAX_HISTORY = 100;

/**
 * src/hooks/useShapes.ts
 * Состояние фигур: список, добавление (в т.ч. перетаскиванием мыши), изменение,
 * выделение — плюс история Undo/Redo (Ctrl+Z / Ctrl+Shift+Z).
 * Логика здесь, интерфейс — в компонентах: те подписываются на результат
 * и зовут методы.
 */
export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Зеркало committed-фигур и стеков истории: читаем и пишем их в обработчиках
  // напрямую, без побочных эффектов внутри апдейтеров setState (StrictMode-safe).
  const shapesRef = useRef<Shape[]>(shapes);
  shapesRef.current = shapes;

  const undoStackRef = useRef<Shape[][]>([]);
  const redoStackRef = useRef<Shape[][]>([]);

  // Один жест перетаскивания = один шаг истории: после первой записи флаг
  // блокирует повторные, пока жест не закончен (endGesture из Canvas).
  const historyPushedRef = useRef(false);

  /**
   * «Черновик» — фигура, которую пользователь растягивает мышью по канвасу
   * (создаётся при mousedown, умирает при mouseup). Дублируется в ref, чтобы
   * коммит не зависел от устаревших замыканий и корректно вёл себя в StrictMode.
   */
  const [draft, setDraft] = useState<Shape | null>(null);
  const draftRef = useRef<Shape | null>(null);

  /** Записать «до»-состояние фигур в историю отмены и очистить redo. */
  const pushHistory = useCallback(() => {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-(MAX_HISTORY - 1)),
      shapesRef.current,
    ];
    redoStackRef.current = [];
  }, []);

  /** Ctrl+Z: вернуть предыдущее состояние фигур. */
  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    const previous = stack[stack.length - 1];
    if (!previous) return;
    undoStackRef.current = stack.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, shapesRef.current];
    setShapes(previous);
  }, []);

  /** Ctrl+Shift+Z: повторить отменённое изменение. */
  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    const next = stack[stack.length - 1];
    if (!next) return;
    redoStackRef.current = stack.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, shapesRef.current];
    setShapes(next);
  }, []);

  /** Жест закончился (mouseup/уход мыши) — история снова открыта для записи. */
  const endGesture = useCallback(() => {
    historyPushedRef.current = false;
  }, []);

  /** Просто создать фигуру с готовыми размерами и выделить её. */
  const addShape = useCallback(
    (type: ShapeType, x: number, y: number, width: number, height: number): string => {
      pushHistory();
      const id = createId();
      const shape: Shape = {
        id,
        type,
        x,
        y,
        width,
        height,
        fill: DEFAULT_FILL,
        stroke: DEFAULT_STROKE,
        rotation: 0,
      };
      setShapes((prev) => [...prev, shape]);
      setSelectedIds([id]);
      return id;
    },
    [pushHistory],
  );

  /** Начать рисование: зафиксировать опорную точку (начало перетаскивания). */
  const startDraft = useCallback((type: ShapeType, x: number, y: number) => {
    const shape: Shape = {
      id: createId(),
      type,
      x,
      y,
      width: 0,
      height: 0,
      fill: DEFAULT_FILL,
      stroke: DEFAULT_STROKE,
      rotation: 0,
    };
    draftRef.current = shape;
    setDraft(shape);
  }, []);

  /** Растянуть черновик до точки (x, y): нормализуем перетаскивание в любую сторону. */
  const updateDraft = useCallback((x: number, y: number) => {
    const prev = draftRef.current;
    if (!prev) return;
    const next: Shape = {
      ...prev,
      x: Math.min(prev.x, x),
      y: Math.min(prev.y, y),
      width: Math.abs(x - prev.x),
      height: Math.abs(y - prev.y),
    };
    draftRef.current = next;
    setDraft(next);
  }, []);

  /** Завершить рисование: черновик становится настоящей фигурой и выделяется. */
  const commitDraft = useCallback(() => {
    const prev = draftRef.current;
    draftRef.current = null;
    setDraft(null);
    if (!prev) return;

    pushHistory();
    const shape: Shape = {
      ...prev,
      // Минимальный размер, чтобы щелчок без перетаскивания
      // не оставлял невидимую фигуру нулевого размера.
      width: Math.max(prev.width, 1),
      height: Math.max(prev.height, 1),
    };
    setShapes((current) => [...current, shape]);
    setSelectedIds([shape.id]);
  }, [pushHistory]);

  /** Точечно изменить поля фигуры (например, цвет заливки из панели свойств). */
  const updateShape = useCallback(
    (id: string, patch: Partial<Omit<Shape, 'id'>>) => {
      pushHistory();
      setShapes((prev) =>
        prev.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)),
      );
    },
    [pushHistory],
  );

  /**
   * Перетаскивание: сдвинуть все выделенные фигуры на (dx, dy) в координатах
   * канваса. Дельту считает Canvas через screenToCanvas — фигура едет ровно
   * за курсором независимо от зума и панорамирования. История пишется один
   * раз за жест, поэтому один drag = один шаг Undo.
   */
  const moveSelectedShapes = useCallback(
    (dx: number, dy: number) => {
      if (dx === 0 && dy === 0) return;
      if (!historyPushedRef.current) {
        pushHistory();
        historyPushedRef.current = true;
      }
      setShapes((prev) =>
        prev.map((shape) =>
          selectedIds.includes(shape.id)
            ? { ...shape, x: shape.x + dx, y: shape.y + dy }
            : shape,
        ),
      );
    },
    [pushHistory, selectedIds],
  );

  /** Задать выделение (пустой массив — снять всё). */
  const selectShapes = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  return {
    shapes,
    selectedIds,
    draft,
    undo,
    redo,
    endGesture,
    addShape,
    startDraft,
    updateDraft,
    commitDraft,
    updateShape,
    moveSelectedShapes,
    selectShapes,
  };
}