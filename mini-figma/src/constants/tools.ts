import type { ShapeType, Tool } from '../types/shape';

/** Описание инструмента для тулбара. */
export interface ToolDefinition {
  id: Tool;
  label: string;
  /** Клавиша «быстрого» вызова. */
  hint: string;
  /** Тип фигуры, которую создаёт инструмент (у select — undefined). */
  shapeType?: ShapeType;
}

/**
 * Единый список инструментов. Горячие клавиши — прямо здесь:
 * V — move/select, R — rectangle, O — ellipse.
 * Меняем раскладку или добавляем инструмент только в этом файле.
 */
export const TOOLS: ToolDefinition[] = [
  { id: 'select', label: 'Move', hint: 'V' },
  { id: 'rectangle', label: 'Rectangle', hint: 'R', shapeType: 'rectangle' },
  { id: 'ellipse', label: 'Ellipse', hint: 'O', shapeType: 'ellipse' },
];

/** Соответствие клавиши -> инструмент (используется в useHotkeys). */
export const TOOL_BY_KEY: Record<string, Tool> = {
  v: 'select',
  r: 'rectangle',
  o: 'ellipse',
};

/** Горячие клавиши истории изменений (как в Figma: Ctrl+Z / Ctrl+Shift+Z). */
export const HISTORY_HOTKEYS: Record<string, 'undo' | 'redo'> = {
  'ctrl+z': 'undo',
  'ctrl+shift+z': 'redo',
  'ctrl+y': 'redo',
};