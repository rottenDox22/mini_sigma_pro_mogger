import type { Point, Shape, Viewport } from '../types/shape';

/**
 * src/utils/geometry.ts
 * Чистая математика пересчёта координат — без DOM, без состояния.
 *
 * Связь систем координат:
 *   экран = канвас * zoom + сдвиг камеры
 *   канвас = (экран - сдвиг) / zoom
 *
 * Без этого пересчёта фигуры будут «уезжать» от курсора при зуме и сдвиге холста.
 */

/** Экранная точка (относительно контейнера холста) → точка канваса. */
export function screenToCanvas(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.x) / viewport.zoom,
    y: (point.y - viewport.y) / viewport.zoom,
  };
}

/** Точка канваса → экранная точка (для рендера и HUD). */
export function canvasToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: point.x * viewport.zoom + viewport.x,
    y: point.y * viewport.zoom + viewport.y,
  };
}

/** Попадает ли точка канваса внутрь фигуры (для эллипса — точная проверка по формуле). */
export function containsPoint(shape: Shape, point: Point): boolean {
  if (shape.type === 'ellipse') {
    const rx = shape.width / 2;
    const ry = shape.height / 2;
    if (rx <= 0 || ry <= 0) return false;
    const nx = (point.x - (shape.x + rx)) / rx;
    const ny = (point.y - (shape.y + ry)) / ry;
    return nx * nx + ny * ny <= 1;
  }
  return (
    point.x >= shape.x &&
    point.x <= shape.x + shape.width &&
    point.y >= shape.y &&
    point.y <= shape.y + shape.height
  );
}

/** Верхняя фигура под точкой (последняя в списке рисуется поверх остальных), либо null. */
export function topShapeAt(point: Point, shapes: readonly Shape[]): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (containsPoint(shapes[i], point)) return shapes[i];
  }
  return null;
}