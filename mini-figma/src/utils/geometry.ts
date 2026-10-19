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

/** Маркер рамки выделения: 4 угла (двигают две стороны) + 4 середины сторон (одну). */
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** Модификаторы жеста ресайза — клавиши, зажатые во время перетаскивания маркера. */
export interface ResizeModifiers {
  /** Shift: сохранять исходные пропорции. */
  aspect: boolean;
  /** Alt: ресайз от центра (противоположный край тоже двигается). */
  fromCenter: boolean;
}

/** Оси, которые двигает каждый маркер: 1 — правая/нижняя, -1 — левая/верхняя, 0 — не двигает. */
const HANDLE_AXES: Record<ResizeHandle, { hx: -1 | 0 | 1; hy: -1 | 0 | 1 }> = {
  nw: { hx: -1, hy: -1 },
  n: { hx: 0, hy: -1 },
  ne: { hx: 1, hy: -1 },
  e: { hx: 1, hy: 0 },
  se: { hx: 1, hy: 1 },
  s: { hx: 0, hy: 1 },
  sw: { hx: -1, hy: 1 },
  w: { hx: -1, hy: 0 },
};

/**
 * Ресайз за маркер: тянем маркер в точку current (мировые координаты) —
 * считаем новый прямоугольник. Якорь (противоположный угол/сторона) неподвижен;
 * с Alt якорь — центр фигуры; со Shift сохраняются пропорции. Перетаскивание
 * маркера за якорь «переворачивает» фигуру, как в Figma. Минимальный размер —
 * 1px: жест ресайза нельзя отменить кликом, поэтому не даём вырожденному
 * прямоугольнику (в отличие от рисования, где клик просто не создаёт фигуру).
 */
export function resizeRect(
  origin: Pick<Shape, 'x' | 'y' | 'width' | 'height'>,
  handle: ResizeHandle,
  current: Point,
  { aspect, fromCenter }: ResizeModifiers,
): Pick<Shape, 'x' | 'y' | 'width' | 'height'> {
  const { hx, hy } = HANDLE_AXES[handle];
  const hw0 = origin.width / 2;
  const hh0 = origin.height / 2;
  const cx = origin.x + hw0;
  const cy = origin.y + hh0;

  // Полупмеры со знаком: ноль и меньше = фигура перевернулась через якорь.
  let hw: number;
  let hh: number;
  if (fromCenter) {
    // Центр неподвижен: тянется сторона до курсора, вторая симметрично.
    hw = hx === 0 ? hw0 : current.x - cx;
    hh = hy === 0 ? hh0 : current.y - cy;
  } else {
    // Якорь — противоположная сторона: тянущаяся сторона встаёт на курсор.
    hw = hx > 0 ? (current.x - origin.x) / 2 : hx < 0 ? (origin.x + origin.width - current.x) / 2 : hw0;
    hh = hy > 0 ? (current.y - origin.y) / 2 : hy < 0 ? (origin.y + origin.height - current.y) / 2 : hh0;
  }

  // Shift: пропорции. Угол тянет обе оси — масштаб по доминирующей, вторая
  // ось подтягивается с тем же коэффициентом от ИСХОДНОГО размера; сторона
  // тянет одну ось, вторая растёт с тем же коэффициентом вокруг центра.
  if (aspect) {
    if (hx !== 0 && hy !== 0) {
      const scale = Math.max(Math.abs(hw) / hw0, Math.abs(hh) / hh0);
      hw = (hw < 0 ? -1 : 1) * hw0 * scale;
      hh = (hh < 0 ? -1 : 1) * hh0 * scale;
    } else if (hx !== 0) {
      hh *= Math.abs(hw) / hw0;
    } else if (hy !== 0) {
      hw *= Math.abs(hh) / hh0;
    }
  }

  const width = Math.max(1, Math.abs(hw) * 2);
  const height = Math.max(1, Math.abs(hh) * 2);

  // Позиция: якорная сторона неподвижна; центр (Alt) и не тянущаяся ось — симметрично.
  let x: number;
  if (fromCenter || hx === 0) x = cx - width / 2;
  else if (hx > 0) x = Math.min(origin.x, origin.x + hw * 2); // якорь — левая сторона
  else x = origin.x + origin.width - Math.max(hw * 2, 0); // якорь — правая сторона
  let y: number;
  if (fromCenter || hy === 0) y = cy - height / 2;
  else if (hy > 0) y = Math.min(origin.y, origin.y + hh * 2); // якорь — верхняя сторона
  else y = origin.y + origin.height - Math.max(hh * 2, 0); // якорь — нижняя сторона

  return { x, y, width, height };
}