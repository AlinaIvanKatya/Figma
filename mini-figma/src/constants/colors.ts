import type { ShapeType } from '../types/shape';

/** Заливка по умолчанию для новых фигур каждого типа. */
export const DEFAULT_FILL: Record<ShapeType, string> = {
  rectangle: '#DCE6FF',
  ellipse: '#D9F2E5',
};

/** Штрих по умолчанию для новых фигур каждого типа. */
export const DEFAULT_STROKE: Record<ShapeType, string> = {
  rectangle: '#3B6FF2',
  ellipse: '#1FA971',
};

/**
 * Палитра заливки в панели свойств. Включает дефолтные цвета фигур,
 * чтобы текущая заливка всегда была представлена в палитре.
 */
export const SHAPE_COLORS: readonly string[] = [
  DEFAULT_FILL.rectangle,
  DEFAULT_FILL.ellipse,
  '#FFE8A3',
  '#FFD6D6',
  '#D6E4FF',
  '#E6D9FF',
  '#CFFAFE',
  '#FDE68A',
];