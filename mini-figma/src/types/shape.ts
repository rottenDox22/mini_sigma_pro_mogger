/**
 * src/types/shape.ts
 * Единый «язык проекта»: все сущности, о которых говорят хуки, компоненты
 * и утилиты, описаны здесь один раз. TypeScript ловит ошибки до запуска.
 */

/** Виды фигур, которые умеет рисовать редактор. */
export type ShapeType = 'rectangle' | 'ellipse';

/** Инструменты панели слева. */
export type Tool = 'select' | 'rectangle' | 'ellipse';

/** Точка/координаты на холсте (в единицах канваса). */
export interface Point {
  x: number;
  y: number;
}

/** Фигура на холсте: прямоугольник или эллипс. */
export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  rotation: number;
}

/**
 * Камера холста: сдвиг (x, y) в экранных пикселях относительно контейнера
 * и масштаб zoom. Экранная координата = canvas*zoom + (x, y).
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}