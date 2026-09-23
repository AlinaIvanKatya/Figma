import { useEffect, useRef } from 'react';

export type HotkeyHandler = (event: KeyboardEvent) => void;
/** Словарь: комбинация клавиш -> обработчик. */
export type HotkeyMap = Record<string, HotkeyHandler>;

/**
 * Ключ комбинации: 'r', 'v', 'ctrl+z', 'ctrl+shift+z' и т.п.
 * Модификаторы собираются в строку (meta/cmd мака считается как ctrl).
 */
function hotkeyKey(event: KeyboardEvent): string {
  const key = event.key.toLowerCase();
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.shiftKey) parts.push('shift');
  if (event.altKey) parts.push('alt');
  return [...parts, key].join('+');
}

/**
 * Горячие клавиши: регистрирует обработчики на keydown окна.
 *
 * Список комбинаций живёт в constants/tools.ts (TOOL_BY_KEY — R/O/V,
 * HISTORY_HOTKEYS — undo/redo), здесь — только доставка событий.
 */
export function useHotkeys(handlers: HotkeyMap) {
  // Актуальный словарь храним в ref, чтобы не перевешивать listener на каждый рендер.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Не перехватываем ввод в полях и выпадающих списках.
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const handler = handlersRef.current[hotkeyKey(event)];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}