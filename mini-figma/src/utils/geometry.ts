import type { Point, Shape, Viewport } from '../types/shape';

/**
 * Чистая математика пересчёта координат. Без неё фигуры «уезжают» от курсора
 * при зуме и панорамировании: курсор приходит в экранных px, а фигуры живут
 * в мировых (канвасовых) координатах.
 */

/** Экранные px -> мировые координаты (учитывает зум и панорамирование). */
export function screenToWorld(screenX: number, screenY: number, viewport: Viewport): Point {
  return {
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  };
}

/** Мировые координаты -> экранные px. */
export function worldToScreen(world: Point, viewport: Viewport): Point {
  return {
    x: world.x * viewport.zoom + viewport.x,
    y: world.y * viewport.zoom + viewport.y,
  };
}

/**
 * Прямоугольник перетаскивания: нормализует пару точек (начало, курсор)
 * в корректный прямоугольник — можно рисовать в любую сторону (вверх/влево).
 */
export function normalizeRect(start: Point, end: Point): Pick<Shape, 'x' | 'y' | 'width' | 'height'> {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}