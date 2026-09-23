import { useCallback, useMemo, useRef, useState } from 'react';
import { DEFAULT_FILL, DEFAULT_STROKE } from '../constants/colors';
import { TOOLS } from '../constants/tools';
import type { Point, Shape, ShapeType, Tool } from '../types/shape';
import { normalizeRect } from '../utils/geometry';

/** Параметры для создания новой фигуры. */
export interface NewShapeOptions {
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Идентификатор «черновика» — фигуры, которая рисуется прямо сейчас. */
const DRAFT_ID = 'draft';

/** Максимальная глубина истории Undo/Redo. */
const SHAPES_HISTORY_LIMIT = 100;

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `shape-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Пара эталонных слоёв — сразу видно, что зум/панорама и рендер работают.
const INITIAL_SHAPES: Shape[] = [
  {
    id: 'seed-rect-1',
    type: 'rectangle',
    x: -200,
    y: -110,
    width: 200,
    height: 130,
    fill: DEFAULT_FILL.rectangle,
    stroke: DEFAULT_STROKE.rectangle,
    strokeWidth: 1.5,
    rotation: 0,
    selected: false,
  },
  {
    id: 'seed-ellipse-1',
    type: 'ellipse',
    x: 60,
    y: -60,
    width: 170,
    height: 130,
    fill: DEFAULT_FILL.ellipse,
    stroke: DEFAULT_STROKE.ellipse,
    strokeWidth: 1.5,
    rotation: 0,
    selected: false,
  },
];

/**
 * Состояние фигур: список, добавление, изменение, выделение, рисование,
 * перетаскивание и история изменений (Undo/Redo).
 *
 * Все координаты — мировые (канвасовые): пересчёт экран -> мир с учётом
 * зума и панорамирования делает Canvas через geometry.ts. Здесь —
 * только данные и операции над ними.
 *
 * История: каждый шаг — массив фигур до действия (снимок в ref —
 * массивы иммутабельны, ссылка на старый массив остаётся «как было»).
 * Одно логическое действие = один шаг: создание фигуры, смена цвета,
 * удаление, одно перетаскивание целиком. Выделение в историю не входит.
 */
export function useShapes(activeTool: Tool) {
  const [shapes, setShapes] = useState<Shape[]>(INITIAL_SHAPES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Актуальный список для вычислений в обработчиках (без stale-замыканий).
  const shapesRef = useRef<Shape[]>(INITIAL_SHAPES);
  // История: прошлое (undo) и будущее (redo) — стэки снимков.
  const historyPast = useRef<Shape[][]>([]);
  const historyFuture = useRef<Shape[][]>([]);
  // Зеркала для устойчивости к батчингу событий.
  const draftRef = useRef<Shape | null>(null);
  const moveRef = useRef<{ id: string; pointer: Point; originX: number; originY: number } | null>(null);
  /** Снимок списка в момент начала перетаскивания (для одного шага истории). */
  const moveSnapshotRef = useRef<Shape[] | null>(null);

  const selectedShape = shapes.find((shape) => shape.id === selectedId) ?? null;

  /** Единственная точка записи списка: синхронизирует ref и state. */
  const commitShapes = useCallback((next: Shape[]) => {
    shapesRef.current = next;
    setShapes(next);
  }, []);

  /** Снимает снимок ТЕКУЩЕГО состояния в историю (вызывается ДО изменения) и чистит redo. */
  const pushHistory = useCallback(() => {
    historyPast.current = [...historyPast.current, shapesRef.current].slice(-SHAPES_HISTORY_LIMIT);
    historyFuture.current = [];
  }, []);

  /** Смена выделения — управляет только флагами и id, в историю не пишется. */
  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id);
    shapesRef.current = shapesRef.current.map((shape) => ({
      ...shape,
      selected: shape.id === id,
    }));
    setShapes(shapesRef.current);
  }, []);

  const addShape = useCallback(
    (options: NewShapeOptions): string => {
      const id = createId();
      const shape: Shape = {
        id,
        ...options,
        fill: DEFAULT_FILL[options.type],
        stroke: DEFAULT_STROKE[options.type],
        strokeWidth: 1.5,
        rotation: 0,
        selected: false,
      };
      pushHistory();
      commitShapes([...shapesRef.current, shape]);
      selectShape(id); // выделение — не часть истории
      return id;
    },
    [pushHistory, commitShapes, selectShape],
  );

  const updateShape = useCallback(
    (id: string, patch: Partial<Omit<Shape, 'id'>>) => {
      pushHistory();
      commitShapes(shapesRef.current.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)));
    },
    [pushHistory, commitShapes],
  );

  const removeShape = useCallback(
    (id: string) => {
      pushHistory();
      commitShapes(shapesRef.current.filter((shape) => shape.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [pushHistory, commitShapes],
  );

  /** Тип фигуры, которую рисует текущий инструмент (null — режим выделения). */
  const drawnShapeType = useMemo(
    () => TOOLS.find((tool) => tool.id === activeTool)?.shapeType ?? null,
    [activeTool],
  );

  /** Начало перетаскивания создания: создаём «черновик» в мировой точке клика. */
  const startDraw = useCallback(
    (start: Point) => {
      if (!drawnShapeType) return;
      selectShape(null); // снимаем выделение — начинаем рисовать с чистого листа
      const next: Shape = {
        id: DRAFT_ID,
        type: drawnShapeType,
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
        fill: DEFAULT_FILL[drawnShapeType],
        stroke: DEFAULT_STROKE[drawnShapeType],
        strokeWidth: 1.5,
        rotation: 0,
        selected: false,
      };
      draftRef.current = next;
      setDraft(next);
    },
    [drawnShapeType, selectShape],
  );

  /** Тянем: пересчитываем прямоугольник черновика по текущей точке курсора. */
  const updateDraw = useCallback((current: Point) => {
    const prev = draftRef.current;
    if (!prev) return;
    const next: Shape = { ...prev, ...normalizeRect(prev, current) };
    draftRef.current = next;
    setDraft(next);
  }, []);

  /** Отпустили мышь: коммитим фигуру (один шаг истории) или отменяем клик без сдвига. */
  const finishDraw = useCallback(() => {
    const current = draftRef.current;
    if (!current) return;
    draftRef.current = null;
    setDraft(null);
    if (current.width < 2 || current.height < 2) return; // просто клик — ничего не создаём
    const id = createId();
    pushHistory();
    commitShapes([...shapesRef.current, { ...current, id, selected: false }]);
    selectShape(id); // новая фигура сразу выделена
  }, [pushHistory, commitShapes, selectShape]);

  // --- Перетаскивание выделенной фигуры ---

  /** Начало перетаскивания: запоминаем id, точку захвата и снимок списка ДО движения. */
  const startMove = useCallback((id: string, pointer: Point) => {
    const shape = shapesRef.current.find((s) => s.id === id);
    if (!shape) return;
    setMovingId(id);
    moveSnapshotRef.current = shapesRef.current; // иммутабельный массив = «как было»
    moveRef.current = { id, pointer, originX: shape.x, originY: shape.y };
  }, []);

  /** Двигаем: смещаем фигуру на дельту курсора (в мировых единицах), без истории. */
  const updateMove = useCallback(
    (pointer: Point) => {
      const move = moveRef.current;
      if (!move) return;
      const dx = pointer.x - move.pointer.x;
      const dy = pointer.y - move.pointer.y;
      commitShapes(
        shapesRef.current.map((s) => (s.id === move.id ? { ...s, x: s.x + dx, y: s.y + dy } : s)),
      );
      moveRef.current = { ...move, pointer };
    },
    [commitShapes],
  );

  /** Конец перетаскивания: если фигура реально сдвинулась — один шаг истории. */
  const endMove = useCallback(() => {
    const move = moveRef.current;
    if (move) {
      const shape = shapesRef.current.find((s) => s.id === move.id);
      const moved = Boolean(shape && (shape.x !== move.originX || shape.y !== move.originY));
      if (moved && moveSnapshotRef.current) {
        historyPast.current = [...historyPast.current, moveSnapshotRef.current].slice(-SHAPES_HISTORY_LIMIT);
        historyFuture.current = [];
      }
    }
    moveSnapshotRef.current = null;
    moveRef.current = null;
    setMovingId(null);
  }, []);

  // --- История (Undo / Redo) ---

  /** Применяет снимок из истории и нормализует выделение. */
  const applyHistory = useCallback((target: Shape[]) => {
    draftRef.current = null;
    setDraft(null);
    shapesRef.current = target;
    setShapes(target);
    setSelectedId((current) => (target.some((s) => s.id === current) ? current : null));
  }, []);

  const undo = useCallback(() => {
    const previous = historyPast.current.pop();
    if (!previous) return;
    historyFuture.current.push(shapesRef.current);
    applyHistory(previous);
  }, [applyHistory]);

  const redo = useCallback(() => {
    const next = historyFuture.current.pop();
    if (!next) return;
    historyPast.current = [...historyPast.current, shapesRef.current].slice(-SHAPES_HISTORY_LIMIT);
    applyHistory(next);
  }, [applyHistory]);

  return {
    shapes,
    selectedId,
    selectedShape,
    draft,
    movingId,
    addShape,
    updateShape,
    selectShape,
    removeShape,
    startDraw,
    updateDraw,
    finishDraw,
    startMove,
    updateMove,
    endMove,
    undo,
    redo,
  };
}