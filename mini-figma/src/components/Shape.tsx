import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Shape } from '../types/shape';
import type { ResizeHandle } from '../utils/geometry';

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
  /** Начало ресайза за маркер (мировые координаты посчитает Canvas). */
  onResizeStart?: (event: ReactPointerEvent<SVGElement>, handle: ResizeHandle) => void;
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
function selectionHandles(shape: Shape): Array<{ x: number; y: number; handle: ResizeHandle }> {
  const p = SELECTION_PADDING;
  const w = shape.width;
  const h = shape.height;
  return [
    { x: -p, y: -p, handle: 'nw' },
    { x: w / 2, y: -p, handle: 'n' },
    { x: w + p, y: -p, handle: 'ne' },
    { x: w + p, y: h / 2, handle: 'e' },
    { x: w + p, y: h + p, handle: 'se' },
    { x: w / 2, y: h + p, handle: 's' },
    { x: -p, y: h + p, handle: 'sw' },
    { x: -p, y: h / 2, handle: 'w' },
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
export default function ShapeView({ shape, zoom, onSelect, onDragStart, onResizeStart }: ShapeViewProps) {
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
          {selectionHandles(shape).map(({ x, y, handle }) => (
            <rect
              key={handle}
              x={x - handleSize / 2}
              y={y - handleSize / 2}
              width={handleSize}
              height={handleSize}
              fill="#ffffff"
              stroke={SELECTION_COLOR}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              // Атрибут на <g> наследуется всем детям как none; маркер —
              // исключение: перезаписывает наследство, чтобы быть кликабельным.
              pointerEvents={onResizeStart ? 'all' : undefined}
              onPointerDown={
                onResizeStart
                  ? (event) => {
                      // Иначе событие всплывёт к <svg> и одновременно начнёт
                      // перетаскивание фигуры (onDragStart) — ресайза не будет.
                      event.stopPropagation();
                      onResizeStart(event, handle);
                    }
                  : undefined
              }
            />
          ))}
        </g>
      )}
    </svg>
  );
}