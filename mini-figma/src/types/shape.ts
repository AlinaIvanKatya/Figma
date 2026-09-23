/**
 * Единый «язык» проекта.
 * Все слои (constants / utils / hooks / components) говорят об одних и тех же
 * сущностях через эти типы — TypeScript ловит противоречия до запуска.
 */

/** Инструмент, выбранный в тулбаре. */
export type Tool = 'select' | 'rectangle' | 'ellipse';

/** Вид фигуры. */
export type ShapeType = 'rectangle' | 'ellipse';

/** Точка в мировых (канвасовых) координатах. */
export interface Point {
  x: number;
  y: number;
}

/** Камера: мировое начало (0, 0) проецируется в точку (x, y) экрана, единица мира = zoom пикселей. */
export interface Viewport {
  /** Экранная позиция мировой точки (0, 0), px */
  x: number;
  y: number;
  /** Масштаб: 1 мировая единица -> zoom px */
  zoom: number;
}

/** Геометрическая фигура на холсте. */
export interface Shape {
  id: string;
  type: ShapeType;
  /** Верхний левый угол в мировых координатах */
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  /** Угол поворота в градусах (по часовой). */
  rotation: number;
  selected: boolean;
}