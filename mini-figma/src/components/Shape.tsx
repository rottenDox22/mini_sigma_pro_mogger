import type { CSSProperties } from 'react';
import type { Shape as ShapeModel } from '../types/shape';

/** Цвет рамки выделения и маркеров. */
const SEL_COLOR = '#3b82f6';
/** Сторона квадратного маркера в пикселях. */
const HANDLE_SIZE = 8;
/** Отступ рамки выделения за границы фигуры. */
const FRAME_OFFSET = 5;

interface ShapeProps {
  shape: ShapeModel;
  /** Если true — вокруг фигуры рисуется рамка выделения с 8 маркерами. */
  selected: boolean;
}

/** Позиция маркера относительно рамки выделения (лево/верх/право/низ). */
type HandlePosition = Pick<CSSProperties, 'left' | 'top' | 'right' | 'bottom'>;

/**
 * src/components/Shape.tsx
 * Рендер одной фигуры. Когда фигура выделена — поверх неё рисуется рамка
 * (за границами фигуры) с 8 маркерами в углах и на серединах граней.
 * Маркеры пока чисто визуальные (pointer-events: none — не мешают
 * перетаскиванию), ресайз — следующий шаг.
 */
export function Shape({ shape, selected }: ShapeProps) {
  const radius = shape.type === 'ellipse' ? '9999px' : 0;
  const { width: w, height: h } = shape;

  // 8 маркеров: 4 угла + 4 середины граней рамки выделения.
  const handles: HandlePosition[] = [
    { left: -FRAME_OFFSET, top: -FRAME_OFFSET }, // верх-лево
    { left: w / 2 - HANDLE_SIZE / 2, top: -FRAME_OFFSET }, // верх
    { right: -FRAME_OFFSET, top: -FRAME_OFFSET }, // верх-право
    { right: -FRAME_OFFSET, top: h / 2 - HANDLE_SIZE / 2 }, // право
    { right: -FRAME_OFFSET, bottom: -FRAME_OFFSET }, // низ-право
    { left: w / 2 - HANDLE_SIZE / 2, bottom: -FRAME_OFFSET }, // низ
    { left: -FRAME_OFFSET, bottom: -FRAME_OFFSET }, // низ-лево
    { left: -FRAME_OFFSET, top: h / 2 - HANDLE_SIZE / 2 }, // лево
  ];

  return (
    <div
      className="absolute"
      style={{
        left: shape.x,
        top: shape.y,
        width: w,
        height: h,
        transform: `rotate(${shape.rotation}deg)`,
      }}
    >
      {/* Сама фигура */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: shape.fill,
          border: `1px solid ${shape.stroke}`,
          borderRadius: radius,
        }}
      />

      {/* Рамка выделения с маркерами */}
      {selected && (
        <div
          className="pointer-events-none absolute"
          style={{
            inset: -FRAME_OFFSET,
            border: `1px solid ${SEL_COLOR}`,
            borderRadius: radius,
          }}
        >
          {handles.map((position, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                ...position,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                backgroundColor: '#ffffff',
                border: `1px solid ${SEL_COLOR}`,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}