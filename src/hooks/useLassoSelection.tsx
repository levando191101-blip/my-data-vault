import { useState, useCallback, useRef, useEffect } from "react";

interface LassoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseLassoSelectionOptions {
  containerRef: React.RefObject<HTMLElement>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  itemSelector: string;
  getItemId: (element: Element) => string | null;
  enabled?: boolean;
}

interface UseLassoSelectionResult {
  isLassoActive: boolean;
  lassoRect: LassoRect | null;
  selectedIds: Set<string>;
  clearSelection: () => void;
}

export function useLassoSelection({
  containerRef,
  onSelectionChange,
  itemSelector,
  getItemId,
  enabled = true,
}: UseLassoSelectionOptions): UseLassoSelectionResult {
  const [isLassoActive, setIsLassoActive] = useState(false);
  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Calculate lasso rectangle in viewport coordinates (for display)
  const lassoRect: LassoRect | null = lassoStart && lassoEnd ? {
    x: Math.min(lassoStart.x, lassoEnd.x),
    y: Math.min(lassoStart.y, lassoEnd.y),
    width: Math.abs(lassoEnd.x - lassoStart.x),
    height: Math.abs(lassoEnd.y - lassoStart.y),
  } : null;

  // Check if two rectangles intersect
  const rectsIntersect = useCallback((rect1: DOMRect, rect2: { left: number; top: number; right: number; bottom: number }): boolean => {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }, []);

  // Update selection based on lasso rectangle
  const updateSelection = useCallback(() => {
    if (!lassoRect || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Convert lasso rect (which is in container-relative coords) to viewport coords for comparison
    const lassoViewportRect = {
      left: containerRect.left + lassoRect.x,
      top: containerRect.top + lassoRect.y,
      right: containerRect.left + lassoRect.x + lassoRect.width,
      bottom: containerRect.top + lassoRect.y + lassoRect.height,
    };

    const items = container.querySelectorAll(itemSelector);
    const newSelectedIds = new Set<string>();

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      if (rectsIntersect(itemRect, lassoViewportRect)) {
        const id = getItemId(item);
        if (id) {
          newSelectedIds.add(id);
        }
      }
    });

    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  }, [lassoRect, containerRef, itemSelector, getItemId, onSelectionChange, rectsIntersect]);

  // Update selection whenever lasso changes
  useEffect(() => {
    if (isLassoActive) {
      updateSelection();
    }
  }, [isLassoActive, lassoRect, updateSelection]);

  // Handle all mouse events
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only activate with Shift key held
      if (!e.shiftKey) return;
      
      // Don't activate if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('[role="checkbox"]') ||
        target.closest('[data-radix-collection-item]') ||
        target.closest('[draggable="true"]') ||
        target.closest('.cursor-grab') ||
        target.closest('[data-radix-scroll-area-scrollbar]')
      ) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      
      // Calculate position relative to container
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      setLassoStart({ x, y });
      setLassoEnd({ x, y });
      setIsLassoActive(true);
      setSelectedIds(new Set());
      
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isLassoActive || !lassoStart) return;

      const containerRect = container.getBoundingClientRect();
      
      // Calculate position relative to container, clamped to container bounds
      const x = Math.max(0, Math.min(e.clientX - containerRect.left, containerRect.width));
      const y = Math.max(0, Math.min(e.clientY - containerRect.top, containerRect.height));

      setLassoEnd({ x, y });
    };

    const handleMouseUp = () => {
      if (isLassoActive) {
        setIsLassoActive(false);
        setLassoStart(null);
        setLassoEnd(null);
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, containerRef, isLassoActive, lassoStart]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);

  return {
    isLassoActive,
    lassoRect,
    selectedIds,
    clearSelection,
  };
}
