import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Shape } from '../types/shape';

interface ShapeViewProps {
  shape: Shape;
  /**
   * Масштаб камеры: рамка выделения и маркеры на любом зуме остаются
   * одного экранного размера (как в Figma), хотя фигура масштабируется.
   */
  zoom: number;
  /** Клик по фигуре в режиме выделения. */
  onSelect?: () => void;
  /** Начало перетаскивания фигуры (мировые координаты посчитает Canvas). */
  onDragStart?: (event: ReactPointerEvent<SVGSVGElement>) => void;
}

/** Отступ рамки выделения от фигуры, мировые единицы. */
const SELECTION_PADDING = 4;
const SELECTION_COLOR = '#0d99ff';
/** Экранный размер маркера, px. */
const HANDLE_SIZE = 10;

/**
 * Позиции маркеров рамки выделения относительно левого верхнего угла
 * фигуры (локальные координаты svg): 4 угла + 4 середины сторон.
 */
function selectionHandles(shape: Shape): Array<{ x: number; y: number }> {
  const p = SELECTION_PADDING;
  const w = shape.width;
  const h = shape.height;
  return [
    { x: -p, y: -p }, // top-left
    { x: w / 2, y: -p }, // top
    { x: w + p, y: -p }, // top-right
    { x: w + p, y: h / 2 }, // right
    { x: w + p, y: h + p }, // bottom-right
    { x: w / 2, y: h + p }, // bottom
    { x: -p, y: h + p }, // bottom-left
    { x: -p, y: h / 2 }, // left
  ];
}

/**
 * Рендер одной фигуры в мировых координатах (внутри трансформируемого
 * контейнера Canvas): сама фигура + рамка выделения с маркерами.
 *
 * Рамка и маркеры рисуются «поверх» фигуры в её локальных координатах,
 * но их экранный размер не зависит от зума (маркер: size = HANDLE_SIZE/zoom
 * в мировых единицах — на экране всегда HANDLE_SIZE px; рамка: non-scaling-stroke).
 */
export default function ShapeView({ shape, zoom, onSelect, onDragStart }: ShapeViewProps) {
  const style: CSSProperties = {
    position: 'absolute',
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    transform: shape.rotation ? `rotate(${shape.rotation}deg)` : undefined,
    transformOrigin: 'center',
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!onSelect && !onDragStart) return;
    event.stopPropagation(); // не даём сработать фону (снятие выделения/рисование)
    onSelect?.();
    onDragStart?.(event);
  };

  const interactive = Boolean(onSelect || onDragStart);
  const handleSize = HANDLE_SIZE / zoom; // мировой размер маркера (на экране всегда HANDLE_SIZE px)

  return (
    <svg
      style={style}
      overflow="visible"
      className={interactive ? 'cursor-move' : undefined}
      onPointerDown={handlePointerDown}
    >
      {shape.type === 'ellipse' ? (
        <ellipse
          cx={shape.width / 2}
          cy={shape.height / 2}
          rx={shape.width / 2}
          ry={shape.height / 2}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      ) : (
        <rect
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      )}

      {/* Рамка выделения + маркеры вокруг неё. */}
      {shape.selected && (
        <g pointerEvents="none">
          <rect
            x={-SELECTION_PADDING}
            y={-SELECTION_PADDING}
            width={shape.width + SELECTION_PADDING * 2}
            height={shape.height + SELECTION_PADDING * 2}
            fill="none"
            stroke={SELECTION_COLOR}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {selectionHandles(shape).map((point, index) => (
            <rect
              key={index}
              x={point.x - handleSize / 2}
              y={point.y - handleSize / 2}
              width={handleSize}
              height={handleSize}
              fill="#ffffff"
              stroke={SELECTION_COLOR}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      )}
    </svg>
  );
}