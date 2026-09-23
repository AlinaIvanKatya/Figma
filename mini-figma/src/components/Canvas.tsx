import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Point, Shape, Viewport } from '../types/shape';
import { screenToWorld } from '../utils/geometry';
import ShapeView from './Shape';

interface CanvasProps {
  viewport: Viewport;
  isSpacePressed: boolean;
  isPanning: boolean;
  shapes: Shape[];
  /** «Черновик» — фигура, создаваемая перетаскиванием прямо сейчас. */
  draft: Shape | null;
  /** id фигуры, которую сейчас перетаскивают (null — нет). */
  movingId: string | null;
  /** Активен ли инструмент создания фигур (прямоугольник/эллипс). */
  isDrawingTool: boolean;
  onStartPan: (clientX: number, clientY: number) => void;
  onUpdatePan: (clientX: number, clientY: number) => void;
  onEndPan: () => void;
  onZoomAt: (clientX: number, clientY: number, deltaY: number) => void;
  onSelect: (id: string | null) => void;
  /** Создание фигуры перетаскиванием: точки — в мировых координатах. */
  onStartDraw: (point: Point) => void;
  onUpdateDraw: (point: Point) => void;
  onFinishDraw: () => void;
  /** Перетаскивание выделенной фигуры: точки — в мировых координатах. */
  onStartMove: (id: string, point: Point) => void;
  onUpdateMove: (point: Point) => void;
  onEndMove: () => void;
}

/** Размер ячейки сетки в мировых единицах. */
const GRID_SIZE = 24;

/**
 * Холст на весь экран: сетка на фоне (привязана к мировым координатам),
 * фигуры в трансформируемом мировом пространстве, обработка мыши.
 *
 * • Панорамирование (пробел + мышь) и зум колесом — через useViewport.
 * • Создание фигур: при активном инструменте рисования перетаскивание
 *   пересчитывает экранные координаты в мировые через screenToWorld.
 * • Выделение и перетаскивание фигур — в режиме «Move» (select).
 *   Клик по фигуре выделяет её (с рамкой и маркерами из Shape.tsx),
 *   захват и перетаскивание — тоже через screenToWorld.
 */
export default function Canvas({
  viewport,
  isSpacePressed,
  isPanning,
  shapes,
  draft,
  movingId,
  isDrawingTool,
  onStartPan,
  onUpdatePan,
  onEndPan,
  onZoomAt,
  onSelect,
  onStartDraw,
  onUpdateDraw,
  onFinishDraw,
  onStartMove,
  onUpdateMove,
  onEndMove,
}: CanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [cursorWorld, setCursorWorld] = useState({ x: 0, y: 0 });

  // Колесо — нативный non-passive listener, иначе preventDefault не сработает
  // и страница будет скроллиться вместе с зумом.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onZoomAt(event.clientX, event.clientY, event.deltaY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onZoomAt]);

  /** Фигуры интерактивны (клик/перетаскивание) только в режиме Move и не во время панорамы. */
  const shapesInteractive = !isSpacePressed && !isDrawingTool;

  const handleShapeDragStart = (event: ReactPointerEvent<SVGSVGElement>, shape: Shape) => {
    // Захват указателя на самой фигуре: события двигаются/отпускания
    // приходят на неё и всплывают к контейнеру Canvas.
    event.currentTarget.setPointerCapture(event.pointerId);
    onStartMove(shape.id, screenToWorld(event.clientX, event.clientY, viewport));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (isSpacePressed) {
      // Пробел + мышь = панорамирование: перехватываем указатель до отпускания.
      event.currentTarget.setPointerCapture(event.pointerId);
      onStartPan(event.clientX, event.clientY);
      return;
    }
    if (isDrawingTool) {
      // Рисование: фиксируем точку начала в мировых координатах.
      event.currentTarget.setPointerCapture(event.pointerId);
      onSelect(null); // клик по фону снимает выделение
      onStartDraw(screenToWorld(event.clientX, event.clientY, viewport));
      return;
    }
    onSelect(null); // Move: клик по фону снимает выделение
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const world = screenToWorld(event.clientX, event.clientY, viewport);
    setCursorWorld({ x: world.x, y: world.y });
    if (isPanning) {
      onUpdatePan(event.clientX, event.clientY);
    } else if (movingId) {
      onUpdateMove(world);
    } else if (draft) {
      onUpdateDraw(world);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (draft) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      onFinishDraw();
    }
    if (movingId) {
      onEndMove();
    }
    onEndPan();
  };

  const cursor = isPanning ? 'grabbing' : isSpacePressed ? 'grab' : isDrawingTool ? 'crosshair' : 'default';

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 touch-none select-none overflow-hidden bg-white"
      style={{ cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Сетка: размер и сдвиг ячейки считаются из камеры, поэтому линии
          всегда совпадают с мировыми координатами. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(17 24 39 / 0.05) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgb(17 24 39 / 0.05) 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE * viewport.zoom}px ${GRID_SIZE * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* Мировое пространство: фигуры заданы в мировых координатах, камера
          просто сдвигает и масштабирует этот контейнер — поэтому фигуры
          масштабируются вместе с канвасом. */}
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {shapes.map((shape) => (
          <ShapeView
            key={shape.id}
            shape={shape}
            zoom={viewport.zoom}
            onSelect={shapesInteractive ? () => onSelect(shape.id) : undefined}
            onDragStart={
              shapesInteractive ? (event) => handleShapeDragStart(event, shape) : undefined
            }
          />
        ))}
        {draft && <ShapeView key="__draft__" shape={draft} zoom={viewport.zoom} />}
      </div>

      {/* Живая проверка пересчёта экран -> мир: координаты курсора. */}
      <div className="pointer-events-none absolute bottom-2 right-3 rounded bg-black/5 px-1.5 py-0.5 font-mono text-[11px] text-gray-600">
        x: {cursorWorld.x.toFixed(1)}&nbsp;&nbsp;y: {cursorWorld.y.toFixed(1)}
      </div>
    </div>
  );
}