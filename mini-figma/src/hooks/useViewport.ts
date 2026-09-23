import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Viewport } from '../types/shape';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from '../constants/tools';

const INITIAL_ZOOM = 1;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * src/hooks/useViewport.ts
 * Камера холста — чистая логика без интерфейса:
 * - пробел + перетаскивание мыши — панорамирование;
 * - колесо мыши — зум от 10% до 400% (точка под курсором остаётся на месте);
 * - при старте вид центрируется.
 *
 * Компонент Canvas подключает к этой логике мышь, а окошко/колесо слушаем здесь,
 * потому что для колеса нужен нативный listener с passive: false (preventDefault).
 */
export function useViewport(containerRef: RefObject<HTMLElement | null>) {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: INITIAL_ZOOM });
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  // Зеркало viewport для read-доступа внутри стабильных колбэков.
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const panStart = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);

  // Центрирование при старте: (0, 0) канваса помещаем в центр контейнера.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setViewport({
      x: el.clientWidth / 2,
      y: el.clientHeight / 2,
      zoom: INITIAL_ZOOM,
    });
  }, [containerRef]);

  // Пока зажат пробел — активен режим панорамирования (даже если мышь «улетела»
  // за окно, на blur всё сбрасываем, чтобы не зависнуть в режиме).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpaceDown(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        panStart.current = null;
      }
    };
    const onBlur = () => {
      setIsSpaceDown(false);
      panStart.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  /** Начать панорамирование: запоминаем точку захвата и сдвиг камеры в этот момент. */
  const beginPan = useCallback((x: number, y: number) => {
    panStart.current = {
      px: x,
      py: y,
      vx: viewportRef.current.x,
      vy: viewportRef.current.y,
    };
  }, []);

  /** Продолжить панорамирование: двигаем камеру на дельту от точки захвата. */
  const updatePan = useCallback((x: number, y: number) => {
    const start = panStart.current;
    if (!start) return;
    setViewport((v) => ({
      ...v,
      x: start.vx + (x - start.px),
      y: start.vy + (y - start.py),
    }));
  }, []);

  /** Закончить панорамирование. */
  const endPan = useCallback(() => {
    panStart.current = null;
  }, []);

  /**
   * Приблизить/отдалить так, чтобы точка экрана (px, py) осталась на месте.
   * factor > 1 — приближение, < 1 — отдаление. Зум ограничен 10%–400%.
   */
  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    setViewport((v) => {
      const zoom = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const scale = zoom / v.zoom; // во сколько раз «растянется» мир
      return {
        zoom,
        x: px - (px - v.x) * scale,
        y: py - (py - v.y) * scale,
      };
    });
  }, []);

  // Зум колесом. Нативный listener, иначе React-событие wheel не даст
  // preventDefault (браузер зарегистрирует его как passive) и страница будет
  // скроллиться вместе с зумом.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const factor = e.ctrlKey
        ? Math.exp(-e.deltaY * 0.0015) // трекпад с зажатым Ctrl — плавный зум
        : e.deltaY < 0
          ? ZOOM_STEP
          : 1 / ZOOM_STEP;

      zoomAt(px, py, factor);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [containerRef, zoomAt]);

  return { viewport, isSpaceDown, beginPan, updatePan, endPan };
}