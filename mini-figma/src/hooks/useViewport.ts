import { useCallback, useEffect, useRef, useState } from 'react';
import type { Viewport } from '../types/shape';

/** Границы зума: от 10% до 400%. */
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

/** Активная сессия панорамирования. */
interface PanSession {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/**
 * Камера холста: панорамирование (пробел + мышь), зум колесом от 10% до 400%,
 * центрирование мирового начала (0, 0) в середине экрана при старте.
 */
export function useViewport() {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const panSession = useRef<PanSession | null>(null);

  // При старте центр экрана — это мировая точка (0, 0).
  useEffect(() => {
    setViewport({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      zoom: 1,
    });
  }, []);

  // Пробел — временный режим панорамирования (глобально на окне).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault(); // чтобы страница не скроллилась
        setIsSpacePressed(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        panSession.current = null;
      }
    };
    const onWindowBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
      panSession.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, []);

  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      if (!isSpacePressed) return;
      setIsPanning(true);
      panSession.current = {
        startX: clientX,
        startY: clientY,
        originX: viewport.x,
        originY: viewport.y,
      };
    },
    [isSpacePressed, viewport.x, viewport.y],
  );

  const updatePan = useCallback((clientX: number, clientY: number) => {
    const session = panSession.current;
    if (!session) return;
    setViewport((prev) => ({
      ...prev,
      x: session.originX + (clientX - session.startX),
      y: session.originY + (clientY - session.startY),
    }));
  }, []);

  const endPan = useCallback(() => {
    panSession.current = null;
    setIsPanning(false);
  }, []);

  // Зум колесом вокруг точки под курсором: она остаётся на месте.
  const zoomAt = useCallback((clientX: number, clientY: number, deltaY: number) => {
    const factor = Math.exp(-deltaY * 0.0015);
    setViewport((prev) => {
      const nextZoom = clampZoom(prev.zoom * factor);
      if (nextZoom === prev.zoom) return prev;
      const worldX = (clientX - prev.x) / prev.zoom;
      const worldY = (clientY - prev.y) / prev.zoom;
      return {
        zoom: nextZoom,
        x: clientX - worldX * nextZoom,
        y: clientY - worldY * nextZoom,
      };
    });
  }, []);

  return { viewport, isSpacePressed, isPanning, startPan, updatePan, endPan, zoomAt };
}