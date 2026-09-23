import { useState } from 'react';
import Canvas from './components/Canvas';
import LayersPanel from './components/LayersPanel';
import PropertiesPanel from './components/PropertiesPanel';
import Toolbar from './components/Toolbar';
import { HISTORY_HOTKEYS, TOOL_BY_KEY } from './constants/tools';
import { useHotkeys } from './hooks/useHotkeys';
import type { HotkeyMap } from './hooks/useHotkeys';
import { useShapes } from './hooks/useShapes';
import { useViewport } from './hooks/useViewport';
import type { Tool } from './types/shape';

/**
 * Сборка холста и трёх панелей. Вся логика — в хуках, компоненты только
 * рендерят состояние и пробрасывают события.
 */
export default function App() {
  const { viewport, isSpacePressed, isPanning, startPan, updatePan, endPan, zoomAt } =
    useViewport();
  const [tool, setTool] = useState<Tool>('select');
  const {
    shapes,
    selectedId,
    selectedShape,
    draft,
    movingId,
    selectShape,
    updateShape,
    startDraw,
    updateDraw,
    finishDraw,
    startMove,
    updateMove,
    endMove,
    undo,
    redo,
  } = useShapes(tool);

  // Горячие клавиши: список комбинаций — в constants/tools.ts
  // (TOOL_BY_KEY: V/R/O, HISTORY_HOTKEYS: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y).
  const hotkeys: HotkeyMap = {};
  for (const [key, shortcutTool] of Object.entries(TOOL_BY_KEY)) {
    hotkeys[key] = () => setTool(shortcutTool);
  }
  for (const [key, action] of Object.entries(HISTORY_HOTKEYS)) {
    hotkeys[key] = () => (action === 'undo' ? undo() : redo());
  }
  useHotkeys(hotkeys);

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <Canvas
        viewport={viewport}
        isSpacePressed={isSpacePressed}
        isPanning={isPanning}
        shapes={shapes}
        draft={draft}
        movingId={movingId}
        isDrawingTool={tool !== 'select'}
        onStartPan={startPan}
        onUpdatePan={updatePan}
        onEndPan={endPan}
        onZoomAt={zoomAt}
        onSelect={selectShape}
        onStartDraw={startDraw}
        onUpdateDraw={updateDraw}
        onFinishDraw={finishDraw}
        onStartMove={startMove}
        onUpdateMove={updateMove}
        onEndMove={endMove}
      />

      <Toolbar activeTool={tool} onSelectTool={setTool} />

      {/* Смена цвета заливки выбранной фигуры. */}
      <PropertiesPanel
        shape={selectedShape}
        onChangeFill={(fill) => {
          if (selectedId) updateShape(selectedId, { fill });
        }}
      />

      <LayersPanel shapes={shapes} selectedId={selectedId} onSelect={selectShape} />

      {/* Нижняя плашка: подсказки и текущий зум. */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-gray-200 bg-white/90 px-3 py-1 text-xs text-gray-500 shadow">
        <span>
          <kbd className="rounded bg-gray-100 px-1">V</kbd> move ·{' '}
          <kbd className="rounded bg-gray-100 px-1">R</kbd> rect ·{' '}
          <kbd className="rounded bg-gray-100 px-1">O</kbd> ellipse
        </span>
        <span>
          <kbd className="rounded bg-gray-100 px-1">Space</kbd> + drag — pan
        </span>
        <span>Wheel — zoom</span>
        <span className="font-mono text-gray-700">{Math.round(viewport.zoom * 100)}%</span>
      </div>
    </div>
  );
}