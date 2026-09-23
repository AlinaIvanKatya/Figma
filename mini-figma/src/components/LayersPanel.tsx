import type { Shape } from '../types/shape';

interface LayersPanelProps {
  shapes: Shape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const TYPE_LABEL: Record<Shape['type'], string> = {
  rectangle: 'Rectangle',
  ellipse: 'Ellipse',
};

/**
 * Панель слоёв справа. Пока каркас: список фигур, клик выделяет слой.
 * Порядок как в Figma — верхний слой первый.
 */
export default function LayersPanel({ shapes, selectedId, onSelect }: LayersPanelProps) {
  const layers = [...shapes].reverse();

  return (
    <aside className="absolute right-3 top-3 z-10 flex h-72 w-64 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur">
      <header className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
        Layers
      </header>
      <div className="flex-1 overflow-y-auto p-2">
        {layers.length === 0 ? (
          <p className="px-2 py-1 text-sm text-gray-400">No layers yet</p>
        ) : (
          layers.map((shape, index) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => onSelect(shape.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                shape.id === selectedId
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm border"
                style={{ backgroundColor: shape.fill, borderColor: shape.stroke }}
              />
              <span className="truncate font-medium">{TYPE_LABEL[shape.type]}</span>
              <span className="ml-auto text-xs text-gray-400">{layers.length - index}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}