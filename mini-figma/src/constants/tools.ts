import type { Tool } from '../types/shape';

/** Описание одного инструмента панели. */
export interface ToolConfig {
  id: Tool;
  label: string;
  /** Клавиша быстрого выбора (V — выделение, R — прямоугольник, O — эллипс). */
  key: string;
  /** Иконка-символ для каркаса панели. */
  icon: string;
}

/**
 * Список инструментов. Хотите добавить инструмент — добавьте запись сюда,
 * и он появится и в панели, и в горячих клавишах, ничего больше менять не надо.
 */
export const TOOLS: ToolConfig[] = [
  { id: 'select', label: 'Выделение', key: 'v', icon: '↖' },
  { id: 'rectangle', label: 'Прямоугольник', key: 'r', icon: '▭' },
  { id: 'ellipse', label: 'Эллипс', key: 'o', icon: '◯' },
];

/** Клавиша → инструмент: одно место правки, если захотим поменять раскладку. */
export const TOOL_BY_KEY: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((tool) => [tool.key, tool.id] as const),
);

/** Диапазон зума камеры: от 10% до 400%. */
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

/** Множитель зума за один «щелчок» колеса мыши. */
export const ZOOM_STEP = 1.1;