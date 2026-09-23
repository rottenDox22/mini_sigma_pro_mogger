import { useEffect } from 'react';
import type { Tool } from '../types/shape';
import { TOOL_BY_KEY } from '../constants/tools';

export interface HotkeyHandlers {
  /** Выбор инструмента. */
  onSelectTool?: (tool: Tool) => void;
  /** Ctrl+Z — отмена. */
  onUndo?: () => void;
  /** Ctrl+Shift+Z — повтор. */
  onRedo?: () => void;
}

/** Ctrl на Windows/Linux, Command на macOS. */
const withCommand = (e: KeyboardEvent): boolean => e.ctrlKey || e.metaKey;

/**
 * src/hooks/useHotkeys.ts
 * Горячие клавиши, как в Figma:
 *   V — курсор, R — прямоугольник, O — эллипс (клавиши из constants/tools);
 *   Ctrl+Z — отмена, Ctrl+Shift+Z — повтор (история из useShapes).
 * Один централизованный обработчик, чтобы не размазывать клавиатуру
 * по компонентам.
 */
export function useHotkeys({ onSelectTool, onUndo, onRedo }: HotkeyHandlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo: работают с Ctrl/Command; Shift переключает на Redo.
      if (withCommand(e) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) onRedo?.();
        else onUndo?.();
        return;
      }

      // Быстрый выбор инструмента — без модификаторов.
      if (withCommand(e) || e.altKey) return;

      const tool = TOOL_BY_KEY[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        onSelectTool?.(tool);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSelectTool, onUndo, onRedo]);
}