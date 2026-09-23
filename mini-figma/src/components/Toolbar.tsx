import type { ReactNode } from 'react';
import { TOOLS } from '../constants/tools';
import type { Tool } from '../types/shape';

interface ToolbarProps {
  activeTool: Tool;
  onSelectTool: (tool: Tool) => void;
}

const ICONS: Record<Tool, ReactNode> = {
  select: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2l6.5 10.5L8 7.5 13 6 3 2z" strokeLinejoin="round" />
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1" />
    </svg>
  ),
  ellipse: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="8" cy="8" rx="5.5" ry="4.5" />
    </svg>
  ),
};

/**
 * Панель инструментов слева. Пока каркас: кнопки собраны из единого списка
 * constants/tools.ts (там же живут клавиши R / O / V).
 */
export default function Toolbar({ activeTool, onSelectTool }: ToolbarProps) {
  return (
    <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
      {TOOLS.map((tool) => {
        const isActive = tool.id === activeTool;
        return (
          <button
            key={tool.id}
            type="button"
            title={`${tool.label} (${tool.hint})`}
            aria-pressed={isActive}
            onClick={() => onSelectTool(tool.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {ICONS[tool.id]}
          </button>
        );
      })}
    </div>
  );
}