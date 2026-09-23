import { SHAPE_COLORS } from '../constants/colors';
import type { Shape } from '../types/shape';

interface PropertiesPanelProps {
  shape: Shape | null;
  /** Вызывается при выборе цвета заливки на палитре. */
  onChangeFill: (fill: string) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono text-gray-700">{value}</span>
    </div>
  );
}

/**
 * Панель свойств справа: геометрия выбранной фигуры (read-only)
 * и палитра для смены цвета заливки.
 */
export default function PropertiesPanel({ shape, onChangeFill }: PropertiesPanelProps) {
  return (
    <aside className="absolute bottom-3 right-3 top-3 z-10 flex w-64 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur">
      <header className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
        Properties
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {shape ? (
          <div className="space-y-2.5">
            <Row label="Type" value={shape.type} />
            <Row label="X" value={shape.x.toFixed(1)} />
            <Row label="Y" value={shape.y.toFixed(1)} />
            <Row label="W" value={shape.width.toFixed(1)} />
            <Row label="H" value={shape.height.toFixed(1)} />
            <Row label="Rotation" value={`${shape.rotation}°`} />

            {/* Цвет заливки: клик по образцу меняет fill выбранной фигуры. */}
            <div className="pt-1">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                Fill
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {SHAPE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    aria-label={`Fill ${color}`}
                    onClick={() => onChangeFill(color)}
                    className={`h-7 rounded-md border transition-transform hover:scale-105 ${
                      shape.fill === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Nothing selected</p>
        )}
      </div>
    </aside>
  );
}